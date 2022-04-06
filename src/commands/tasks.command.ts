// TODO: stop using repositories whenever TypeORM adds And() and Or() operators...
import Includes from "../entities/operators/Includes.operator.js"
import Discord from "discord.js"
import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Task, { TaskStatus, TaskStatuses } from "../entities/Task.entity.js"

import typeorm from "typeorm"
import CommandMessage from "../struct/CommandMessage.js"
import ApiTypes = require("discord-api-types/v10")
import { hexToRGB, humanizeArray } from "@buildtheearth/bot-utils"

export default new Command({
    name: "tasks",
    aliases: [],
    description: "Read and manage tasks.",
    permission: globalThis.client.roles.STAFF,
    dms: true,
    subcommands: [
        {
            name: "add",
            description: "Create a task.",
            args: [
                {
                    name: "assignees",
                    description: "The people to make do work.",
                    required: false,
                    optionType: "STRING"
                },
                {
                    name: "title",
                    description: "Suggestion title",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "description",
                    description: "Suggestion description",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "status",
                    description: "Task status.",
                    required: false,
                    optionType: "STRING",
                    choices: ["in-progress", "abandoned", "done", "reported", "hidden"]
                }
            ]
        },
        {
            name: "status",
            description: "Change the status of a task.",
            args: [
                {
                    name: "task",
                    description: "Task number.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "status",
                    description: "Task status.",
                    required: true,
                    optionType: "STRING",
                    choices: Object.keys(TaskStatuses)
                }
            ]
        },
        {
            name: "list",
            description: "List all your active tasks."
        },
        {
            name: "report",
            description: "List all done tasks.",
            args: [
                {
                    name: "channel",
                    description: "The channel.",
                    required: true,
                    optionType: "CHANNEL",
                    channelTypes: [ApiTypes.ChannelType.GuildText]
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const Tasks = client.db.getRepository(Task)
        const subcommand = args.consumeSubcommandIf(this.subcommands.map(sub => sub.name))

        if (subcommand === "add" || !subcommand) {
            const regex = /\d{18}/g
            const assignees = (args.consumeIf(regex, "assignees") || "").match(regex)
            const [title, description] = [
                args.consume("title"),
                args.consume("description")
            ]
            const status = args.consume("status").toLowerCase() || null

            const statuses = humanizeArray(Object.keys(TaskStatuses))
            let error: string
            if (title.length > 99) error = message.messages.titleTooLong99
            if (!title || !description) error = message.messages.noBody
            if (status && !TaskStatuses[status])
                error = message.messages.invalidStatus.replace("%s", statuses)
            if (error) return message.sendError(error)

            await message.continue()

            const task = new Task()
            task.title = title
            task.description = description
            task.creator = message.member.id
            task.assignees = Array.from(assignees || [message.member.id])
            task.status = status as TaskStatus
            await task.save()

            await client.response.sendSuccess(
                message,
                `Saved **${Discord.Util.escapeMarkdown(task.title)}**! (**#${task.id}**).`
            )
        } else if (subcommand === "status") {
            const id = Number(args.consume("task"))
            if (Number.isNaN(id)) return message.sendErrorMessage("noID")
            const status = args.consume("status").toLowerCase()
            const statuses = humanizeArray(Object.keys(TaskStatuses))
            if (!TaskStatuses[status])
                return message.sendErrorMessage("invalidStatus", statuses)

            await message.continue()

            const task = await Task.findOne(id)
            task.status = status as TaskStatus
            await task.save()

            await client.response.sendSuccess(message, `Updated task **#${task.id}**!`)
        } else if (subcommand === "list") {
            await message.continue()

            const not = ["done", "reported"]
            if (message.guild) not.push("hidden")
            // 'OR ... IS NULL' is required because 'NULL != "reported"' will never match
            const tasks = await Tasks.createQueryBuilder("task")
                .where(`task.assignees LIKE '%${message.member.id}%'`)
                .andWhere(
                    new typeorm.Brackets(query =>
                        query
                            .where("task.status NOT IN (:not)", { not })
                            .orWhere("task.status IS NULL")
                    )
                )
                .getMany()

            if (!tasks.length) {
                const assignees = Includes(message.member.id)
                const all = await Task.find({ where: { assignees } })
                const goodJob = all.length ? " Good job!" : ""
                return client.response.sendSuccess(
                    message,
                    `You have no pending tasks.${goodJob}`
                )
            }

            const single = tasks.every(task => task.creator === tasks[0].creator)
            const assigner = tasks[0].creator
            const formattedAssigner =
                assigner === message.member.id ? "yourself" : `<@${assigner}>`
            const assignedBy = single ? ` (All assigned by ${formattedAssigner}): ` : ""
            return message.send({
                embeds: [
                    {
                        color: hexToRGB(client.config.colors.info),
                        description: `Here are your active tasks!${assignedBy}`,
                        fields: tasks.map(task => ({
                            name: `#${task.id}: ${task.title} (${task.status || "open"})`,
                            value: task.description
                        }))
                    }
                ]
            })
        } else if (subcommand === "report") {
            await message.continue()

            const channel =
                ((await args.consumeChannel("channel")) as Discord.TextBasedChannel) ||
                message
            const tasks = await Task.find({
                where: {
                    assignees: Includes(message.member.id),
                    status: "done"
                }
            })

            if (!tasks.length) return message.sendErrorMessage("noTasks")

            const report = tasks.map(task => `•   ${task.title}`).join("\n")
            await channel.send(`Task report from <@${message.member.id}>:\n\n${report}`)

            for (const task of tasks) {
                task.status = "reported"
                await task.save()
            }

            if (channel.id !== message.channel.id)
                await client.response.sendSuccess(
                    message,
                    `Sent your task report to ${channel}!`
                )
        }
    }
})
