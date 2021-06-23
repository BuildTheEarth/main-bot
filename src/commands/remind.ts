import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import Reminder from "../entities/Reminder"

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
            const tidy: Record<string, { channel: string; message: string }> = {}

            for (const reminder of reminders) {
                if (!tidy[reminder.id])
                    tidy[reminder.id] = { channel: "", message: "" }

                tidy[reminder.id].channel = reminder.channel
                tidy[reminder.id].message = reminder.message
            }

            let list = ""
            for (const [id, { channel, message }] of Object.entries(tidy)) {
                list += `${id}: \u200B \u200B <#${channel}> - ${message}\n`
            }

            return message.channel.sendSuccess({
                author: { name: "Reminder list" },
                description: list
            })
            
        }

        if (subcommand === "add") {
            const channel = await args.consumeChannel()
            if(!channel){
                return message.channel.sendError("no channel found");
            }

            const time = args.consume().toLowerCase()
            let millis;
            switch(time) {
                case "test":
                    millis = 1000*5 // 5 seconds
                    break
                case "weekly":
                    millis =  1000*60*60*24*7 // 1 week (1000 milliseconds * 60 seconds * 60 minutes * 24 hours * 7 days)
                    break;
                case "bi-weekly":
                    millis =  1000*60*60*24*3.5 // 1 week (1000 milliseconds * 60 seconds * 60 minutes * 24 hours * 3.5 days)
                    break
                case "monthly":
                    millis = 1000*60*60*24*30 // 30 days (1000 milliseconds * 60 seconds * 60 minutes * 24 hours * 30 days)
                    break
                default:
                    return message.channel.sendError("Invalid time length !")
            }

            const body = args.consumeRest()
            if (!body) return message.channel.sendError("You must specify a reminder message.")

            const reminder = new Reminder()
            reminder.channel = channel.id
            reminder.interval = millis
            reminder.message = body
            await reminder.save()
            reminder.schedule(client)

            return message.channel.sendSuccess(`Scheduled reminder for ${channel}!`)
        }

        const id = parseInt(args.consume())
        if (!id) return message.channel.sendError("You must specify an id!")
        
        const reminder = await Reminder.findOne(id)

        if (subcommand === "delete") {
            if(!reminder) return message.channel.sendError("That reminder doesn't exist!")
            await reminder.delete()
            return message.channel.sendSuccess(`Reminder ${id} deleted!`)
        } else if (subcommand === "edit") {
            if(!reminder) return message.channel.sendError("That reminder doesn't exist!")
            const body = args.consumeRest()
            reminder.message = body
            await reminder.save()
            return message.channel.sendSuccess(`Set reminder ${id}'s message to ${body}`)
        }
    }
})
