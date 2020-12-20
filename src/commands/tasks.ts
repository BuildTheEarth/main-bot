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
        }
    ],
    async run(client: Client, message: Message, args: Args) {
        const subcommand = args.consumeIf(["add"])

        if (subcommand === "add" || !subcommand) {
            args.separator = "|"
            const assignees = (args.consumeIf(ID_REGEX) || "").match(ID_REGEX)
            const [title, description] = args.consume(2)
            const status = args.consume().toLowerCase() || null

            if (title.length > 99)
                return message.channel.sendError(
                    "That title is too long! (max. 99 characters)."
                )
            if (!title || !description)
                return message.channel.sendError(
                    "You must provide a title and a description!"
                )
            if (status && !VALID_STATUSES.includes(status)) {
                return message.channel.sendError(
                    `That's not a valid status! (\`${VALID_STATUSES.join("`, `")}\`).`
                )
            }

            const task = new Task()
            task.title = title
            task.description = description
            task.assignees = Array.from(assignees || [message.author.id])
            task.status = status as TaskStatus
            await task.save()

            await message.channel.sendSuccess(
                `Saved **${Discord.Util.escapeMarkdown(task.title)}**! (**#${task.id}**).`
            )
        }
    }
})
