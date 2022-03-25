import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import Reminder from "../entities/Reminder.entity.js"
import ApiTypes = require("discord-api-types/v10")
import CommandMessage from "../struct/CommandMessage.js"
import { formatTimestamp } from "@buildtheearth/bot-utils"
import { isValidCron } from "cron-validator"

const remindTimes = ["test", "weekly", "bi-weekly", "monthly", "bi-monthly", "yearly"]

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
                tidy[reminder.id].end = new Date(
                    Date.now() + reminder.remainder(reminder)
                )
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

            const time = args.consume("interval")
            let cron: string
            if (isValidCron(time)) {
                cron = time
            } else {
                switch (time.toLowerCase()) {
                    case "test":
                        cron = "* * * * *"
                        break
                    case "weekly":
                        cron = "0 0 * * 1" // 1 week (1000ms * 60s * 60m * 24h * 7d)
                        break
                    case "bi-weekly":
                        cron = "0 0 * * 0,3" // half a week (1000ms * 60s * 60m * 24h * 3.5d)
                        break
                    case "monthly":
                        cron = "0 0 1 * *" // 1 month (1000ms * 60s * 60m * 24h * 30d)
                        break
                    case "bi-monthly":
                        cron = "0 0 1,15 * *" // half a month (1000ms * 60s * 60m * 24h * 15d)
                        break
                    case "yearly":
                        cron = "0 0 1 1 *" // 1 month (1000ms * 60s * 60m * 24h * 30d * 12m)
                        break
                    default:
                        return client.response.sendError(
                            message,
                            client.messages.invalidTime
                        )
                }
            }

            const body = args.consumeRest(["message"])
            if (!body)
                return client.response.sendError(message, client.messages.noReminder)

            await message.continue()

            const reminder = new Reminder()
            reminder.channel = channel.id
            reminder.interval = cron
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
