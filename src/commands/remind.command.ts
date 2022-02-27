import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles.util"
import Reminder from "../entities/Reminder.entity"
import formatTimestamp from "../util/formatTimestamp.util"
import ApiTypes from "discord-api-types"
import CommandMessage from "../struct/CommandMessage"

const remindTimes = ["test", "weekly", "bi-weekly", "monthly", "bi-monthly"]

export default new Command({
    name: "remind",
    aliases: ["remindme", "reminders"],
    description: "List and manage reminders.",
    permission: [Roles.MANAGER],
    subcommands: [
        {
            name: "add",
            description: "Add a reminder.",
            permission: [Roles.MANAGER],
            args: [
                {
                    name: "channel",
                    description: "Channel to remind in",
                    required: true,
                    optionType: "CHANNEL",
                    channelTypes: [ApiTypes.ChannelType.GuildText]
                },
                {
                    name: "interval",
                    description: "Reminder interval.",
                    required: true,
                    optionType: "STRING",
                    choices: remindTimes
                },
                {
                    name: "message",
                    description: "Reminder message.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "edit",
            description: "Edit a reminder.",
            permission: [Roles.MANAGER],
            args: [
                {
                    name: "id",
                    description: "Reminder ID",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "message",
                    description: "Reminder message.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a reminder.",
            permission: [Roles.MANAGER],
            args: [
                {
                    name: "id",
                    description: "Reminder ID",
                    required: true,
                    optionType: "STRING"
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommand().toLowerCase()

        if (subcommand === "list" || !subcommand) {
            await message.continue()
            const reminders = await Reminder.find()
            const tidy: Record<string, { channel: string; message: string; end: Date }> =
                {}

            for (const reminder of reminders) {
                if (!tidy[reminder.id])
                    tidy[reminder.id] = { channel: "", message: "", end: new Date() }

                tidy[reminder.id].channel = reminder.channel
                tidy[reminder.id].message = reminder.message
                tidy[reminder.id].end = new Date(Date.now() + reminder.remainder)
            }

            let list = ""
            for (const [id, { channel, message, end }] of Object.entries(tidy)) {
                list += `**#${id}:** <#${channel}> (next ${formatTimestamp(
                    end,
                    "R"
                )}) — ${message}\n`
            }

            return client.response.sendSuccess(message, {
                author: { name: "Reminder list" },
                description: list
            })
        }

        if (subcommand === "add") {
            const channel = await args.consumeChannel("channel")
            if (!channel) {
                return client.response.sendError(message, client.messages.noChannel)
            }

            const time = args.consume("interval").toLowerCase()
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
                    return client.response.sendError(message, client.messages.invalidTime)
            }

            const body = args.consumeRest(["message"])
            if (!body)
                return client.response.sendError(message, client.messages.noReminder)

            await message.continue()

            const reminder = new Reminder()
            reminder.channel = channel.id
            reminder.interval = millis
            reminder.message = body
            await reminder.save()
            reminder.schedule(client)

            return client.response.sendSuccess(
                message,
                `Scheduled reminder for ${channel}!`
            )
        }

        const id = parseInt(args.consume("id"))
        if (!id) return client.response.sendError(message, client.messages.noID)

        await message.continue()

        const reminder = await Reminder.findOne(id)

        if (subcommand === "delete") {
            if (!reminder)
                return client.response.sendError(
                    message,
                    client.messages.reminderNotFound
                )
            await reminder.delete()
            return client.response.sendSuccess(message, `Reminder **#${id}** deleted!`)
        } else if (subcommand === "edit") {
            if (!reminder)
                return client.response.sendError(
                    message,
                    client.messages.reminderNotFound
                )
            const body = args.consumeRest(["message"])
            reminder.message = body
            await reminder.save()
            return client.response.sendSuccess(
                message,
                `Set the message of reminder **#${id}** to:\n>>>${body}`
            )
        }
    }
})
