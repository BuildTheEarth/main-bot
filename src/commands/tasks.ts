// TODO: stop using repositories whenever TypeORM adds And() and Or() operators...
import Includes from "../entities/operators/Includes"
import Discord from "discord.js"
import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Task, { TaskStatus, TaskStatuses } from "../entities/Task"
import Roles from "../util/roles"
import humanizeArray from "../util/humanizeArray"
import { Brackets } from "typeorm"
import hexToRGB from "../util/hexToRGB"

export default new Command({
    name: "tasks",
    aliases: ["task"],
    description: "Read and manage tasks.",
    permission: Roles.STAFF,
    usage: "",
    dms: true,
    subcommands: [
        {
            name: "add",
            description: "Create a task.",
            usage: "[assignees] | <title> | <description> | [status]"
        },
        {
            name: "status",
            description: "Change the status of a task.",
            usage: "<task> <status>"
        },
        {
            name: "list",
            description: "List all your active tasks.",
            usage: ""
        },
        {
            name: "report",
            description: "List all done tasks.",
            usage: "[channel]"
        }
    ],
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const Tasks = client.db.getRepository(Task)
        const subcommand = args.consumeIf(this.subcommands.map(sub => sub.name))

        if (subcommand === "add" || !subcommand) {
            args.separator = "|"
            const regex = /\d{18}/g
            const assignees = (args.consumeIf(regex) || "").match(regex)
            const [title, description] = args.consume(2)
            const status = args.consume().toLowerCase() || null

            const statuses = humanizeArray(Object.keys(TaskStatuses))
            let error: string
            if (title.length > 99)
                error = "The task's title is too long! (max. 99 characters)."
            if (!title || !description)
                error = "You must provide a title and a description!"
            if (status && !TaskStatuses[status])
                error = `That's not a valid status! (${statuses}).`
            if (error) return client.channel.sendError(message.channel, error)

            const task = new Task()
            task.title = title
            task.description = description
            task.creator = message.author.id
            task.assignees = Array.from(assignees || [message.author.id])
            task.status = status as TaskStatus
            await task.save()

            await client.channel.sendSuccess(
                message.channel,
                `Saved **${Discord.Util.escapeMarkdown(task.title)}**! (**#${task.id}**).`
            )
        } else if (subcommand === "status") {
            const id = Number(args.consume())
            if (Number.isNaN(id))
                return client.channel.sendError(
                    message.channel,
                    "You must provide a task ID!"
                )
            const status = args.consume().toLowerCase()
            const statuses = humanizeArray(Object.keys(TaskStatuses))
            if (!TaskStatuses[status])
                return client.channel.sendError(
                    message.channel,
                    `That's not a valid status! (${statuses}).`
                )

            const task = await Task.findOne(id)
            task.status = status as TaskStatus
            await task.save()

            await client.channel.sendSuccess(
                message.channel,
                `Updated task **#${task.id}**!`
            )
        } else if (subcommand === "list") {
            const not = ["done", "reported"]
            if (message.guild) not.push("hidden")
            // 'OR ... IS NULL' is required because 'NULL != "reported"' will never match
            const tasks = await Tasks.createQueryBuilder("task")
                .where(`task.assignees LIKE '%${message.author.id}%'`)
                .andWhere(
                    new Brackets(query =>
                        query
                            .where("task.status NOT IN (:not)", { not })
                            .orWhere("task.status IS NULL")
                    )
                )
                .getMany()

            if (!tasks.length) {
                const assignees = Includes(message.author.id)
                const all = await Task.find({ where: { assignees } })
                const goodJob = all.length ? " Good job!" : ""
                return client.channel.sendSuccess(
                    message.channel,
                    `You have no pending tasks.${goodJob}`
                )
            }

            const single = tasks.every(task => task.creator === tasks[0].creator)
            const assigner = tasks[0].creator
            const formattedAssigner =
                assigner === message.author.id ? "yourself" : `<@${assigner}>`
            const assignedBy = single ? ` (All assigned by ${formattedAssigner}): ` : ""
            return message.channel.send({
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
            const channel = (await args.consumeChannel()) || message.channel
            const tasks = await Task.find({
                where: {
                    assignees: Includes(message.author.id),
                    status: "done"
                }
            })

            if (!tasks.length)
                return client.channel.sendError(
                    message.channel,
                    "Your done task list is empty!"
                )

            const report = tasks.map(task => `•   ${task.title}`).join("\n")
            await channel.send(`Task report from <@${message.author.id}>:\n\n${report}`)

            for (const task of tasks) {
                task.status = "reported"
                await task.save()
            }

            if (channel.id !== message.channel.id)
                await client.channel.sendSuccess(
                    message.channel,
                    `Sent your task report to ${channel}!`
                )
        }
    }
})
