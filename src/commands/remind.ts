import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import Reminder from "../entities/Reminder"
import formatTimestamp from "../util/formatTimestamp"

export default new Command({
    name: "remind",
    aliases: [],
    description: "List and manage reminders.",
    permission: [Roles.MANAGER],
    usage: "",
    subcommands: [
        {
            name: "add",
            description: "Add a reminder.",
            permission: [Roles.MANAGER],
            usage: "<channel> <interval> <message>"
        },
        {
            name: "edit",
            description: "Edit a reminder.",
            permission: [Roles.MANAGER],
            usage: "<id> <message>"
        },
        {
            name: "delete",
            description: "Delete a reminder.",
            permission: [Roles.MANAGER],
            usage: "<id>"
        }
    ],
    async run(this: Command, client: Client, message: Message, args: Args) {
        const subcommand = args.consume().toLowerCase()

        if (subcommand === "list" || !subcommand) {
            const reminders = await Reminder.find()
            const tidy: Record<string, { channel: string; message: string; end: Date }> =
                {}

            for (const reminder of reminders) {
                if (!tidy[reminder.id])
                    tidy[reminder.id] = { channel: "", message: "", end: new Date() }

                tidy[reminder.id].channel = reminder.channel
                tidy[reminder.id].message = reminder.message
                tidy[reminder.id].end = reminder.end
            }

            let list = ""
            for (const [id, { channel, message, end }] of Object.entries(tidy)) {
                list += `**#$id:** <#${channel}> (next ${formatTimestamp(
                    end,
                    "R"
                )}) — ${message}\n`
            }

            return message.channel.sendSuccess({
                author: { name: "Reminder list" },
                description: list
            })
        }

        if (subcommand === "add") {
            const channel = await args.consumeChannel()
            if (!channel) {
                return message.channel.sendError("You must provide a channel!")
            }

            const time = args.consume().toLowerCase()
            let millis
            switch (time) {
                case "test":
                    millis = 1000 * 5
                    break
                case "weekly":
                    millis = 1000 * 60 * 60 * 24 * 7 // 1 week (1000ms * 60s * 60m * 24h * 7d)
                    break
                case "bi-weekly":
                    millis = 1000 * 60 * 60 * 24 * 3.5 // half a week (1000ms * 60s * 60m * 24h * 3.5d)
                    break
                case "monthly":
                    millis = 1000 * 60 * 60 * 24 * 30 // 1 month (1000ms * 60s * 60m * 24h * 30d)
                    break
                case "bi-monthly":
                    millis = 1000 * 60 * 60 * 24 * 15 // half a month (1000ms * 60s * 60m * 24h * 15d)
                    break
                default:
                    return message.channel.sendError("Invalid time length!")
            }

            const body = args.consumeRest()
            if (!body)
                return message.channel.sendError("You must specify a reminder message.")

            const reminder = new Reminder()
            reminder.channel = channel.id
            reminder.interval = millis
            reminder.message = body
            await reminder.save()
            reminder.schedule(client)

            return message.channel.sendSuccess(`Scheduled reminder for ${channel}!`)
        }

        const id = parseInt(args.consume())
        if (!id) return message.channel.sendError("You must specify an ID!")

        const reminder = await Reminder.findOne(id)

        if (subcommand === "delete") {
            if (!reminder)
                return message.channel.sendError("That reminder doesn't exist!")
            await reminder.delete()
            return message.channel.sendSuccess(`Reminder **#${id}** deleted!`)
        } else if (subcommand === "edit") {
            if (!reminder)
                return message.channel.sendError("That reminder doesn't exist!")
            const body = args.consumeRest()
            reminder.message = body
            await reminder.save()
            return message.channel.sendSuccess(
                `Set the message of reminder **#${id}** to:\n>>>${body}`
            )
        }
    }
})
