import { Not, Like, IsNull } from "typeorm"
import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Task, { TaskStatus, VALID_STATUSES } from "../entities/Task"
import Roles from "../util/roles"

const ID_REGEX = /\d{18}/g

export default new Command({
    name: "tasks",
    aliases: ["task"],
    description: "Read and manage tasks.",
    permission: Roles.STAFF,
    usage: "",
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
        }
    ],
    async run(client: Client, message: Message, args: Args) {
        const subcommand = args.consumeIf(["add", "status", "list"])

        if (subcommand === "add" || !subcommand) {
            args.separator = "|"
            const assignees = (args.consumeIf(ID_REGEX) || "").match(ID_REGEX)
            const [title, description] = args.consume(2)
            const status = args.consume().toLowerCase() || null

            let error: string
            if (title.length > 99)
                error = "The task's title is too long! (max. 99 characters)."
            if (!title || !description)
                error = "You must provide a title and a description!"
            if (status && !VALID_STATUSES.includes(status))
                error = `That's not a valid status! (\`${VALID_STATUSES.join("`, `")}\`).`
            if (error) return message.channel.sendError(error)

            const task = new Task()
            task.title = title
            task.description = description
            task.creator = message.author.id
            task.assignees = Array.from(assignees || [message.author.id])
            task.status = status as TaskStatus
            await task.save()

            await message.channel.sendSuccess(
                `Saved **${Discord.Util.escapeMarkdown(task.title)}**! (**#${task.id}**).`
            )
        } else if (subcommand === "status") {
            const id = Number(args.consume())
            if (Number.isNaN(id))
                return message.channel.sendError("You must provide a task ID!")
            const status = args.consume().toLowerCase()
            if (!VALID_STATUSES.includes(status))
                return message.channel.sendError(
                    `That's not a valid status! (\`${VALID_STATUSES.join("`, `")}\`).`
                )

            const task = await Task.findOne(id)
            task.status = status as TaskStatus
            await task.save()

            await message.channel.sendSuccess(`Updated task **#${task.id}**!`)
        } else if (subcommand === "list") {
            const assignees = Like("%" + message.author.id + "%")
            // 'OR IS NULL' is required because 'NULL != "reported"' will never match
            const tasks = await Task.find({
                where: [
                    { assignees, status: Not("reported") },
                    { assignees, status: IsNull() }
                ]
            })

            if (!tasks.length) {
                const all = await Task.find({ where: { assignees } })
                const goodJob = all.length ? " Good job!" : ""
                return message.channel.sendSuccess(`You have no pending tasks.${goodJob}`)
            }

            const single = tasks.every(task => task.creator === tasks[0].creator)
            const assignedBy = single ? ` (All assigned by <@${tasks[0].creator}>): ` : ""
            return message.channel.send({
                embed: {
                    color: client.config.colors.info,
                    description: `Here are your active tasks!${assignedBy}`,
                    fields: tasks.map(task => ({
                        name: `${task.title} (${task.status || "open"})`,
                        value: task.description
                    }))
                }
            })
        }
    }
})
