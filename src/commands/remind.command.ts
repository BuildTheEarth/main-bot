import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import Reminder from "../entities/Reminder.entity.js"
import ApiTypes = require("discord-api-types/v10")
import CommandMessage from "../struct/CommandMessage.js"
import { formatTimestamp } from "@buildtheearth/bot-utils"
import { isValidCron } from "cron-validator"

// remindtimes are ["test", "weekly", "bi-weekly", "monthly", "bi-monthly", "yearly"]

export default new Command({
    name: "remind",
    aliases: [],
    description: "List and manage reminders.",
    permission: [globalThis.client.roles.MANAGER],
    subcommands: [
        {
            name: "add",
            description: "Add a reminder.",
            permission: [globalThis.client.roles.MANAGER],
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
            name: "edit",
            description: "Edit a reminder.",
            permission: [globalThis.client.roles.MANAGER],
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
            permission: [globalThis.client.roles.MANAGER],
            args: [
                {
                    name: "id",
                    description: "Reminder ID",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "list",
            description: "List all reminders.",
            permission: [globalThis.client.roles.MANAGER],
            args: []
        }
    ],
    async run(this: Command, client: BotClient, message: CommandMessage, args: Args) {
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

            return message.sendSuccess({
                author: { name: "Reminder list" },
                description: list
            })
        }

        if (subcommand === "add") {
            const channel = await args.consumeChannel("channel")
            if (!channel) {
                return message.sendErrorMessage("noChannel")
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
                        return message.sendErrorMessage("invalidTime")
                }
            }

            const body = args.consumeRest(["message"])
            if (!body) return message.sendErrorMessage("noReminder")

            await message.continue()

            const reminder = new Reminder()
            reminder.channel = channel.id
            reminder.interval = cron
            reminder.message = body
            await reminder.save()
            reminder.schedule(client)

            return message.sendSuccessMessage("scheduledReminder", channel)
        }

        const id = parseInt(args.consume("id"))
        if (!id) return message.sendErrorMessage("noID")

        await message.continue()

        const reminder = await Reminder.findOne(id)

        if (subcommand === "delete") {
            if (!reminder) return message.sendErrorMessage("reminderNotFound")
            await reminder.delete()
            return message.sendSuccessMessage("deletedReminder", id)
        } else if (subcommand === "edit") {
            if (!reminder) return message.sendErrorMessage("reminderNotFound")
            const body = args.consumeRest(["message"])
            reminder.message = body
            await reminder.save()
            return message.sendSuccessMessage("setReminderBody", id, body)
        }
    }
})
