import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import ModerationNote from "../entities/ModerationNote"
import formatTimestamp from "../util/formatTimestamp"
import Discord from "discord.js"

export default new Command({
    name: "notes",
    aliases: ["note", "modnotes", "modnote"],
    description: "Read and manage moderation notes.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "<member> [body]",
    subcommands: [
        {
            name: "add",
            description: "Add (or append to) the notes for a member.",
            usage: "<member> <body>"
        },
        {
            name: "edit",
            description: "Edit the notes for a member (overwriting the existing ones).",
            usage: "<member> <body>"
        },
        {
            name: "clear",
            description: "Delete the notes for a member.",
            usage: "<member>"
        }
    ],
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const subcommand = args.consumeIf(["add", "edit", "clear"])
        const user = await args.consumeUser(true)
        if (!user)
            return client.channel.sendError(
                message.channel,
                user === undefined
                    ? "You must provide a user!"
                    : "Couldn't find that user."
            )
        const body = args.consumeRest()
        if (subcommand && subcommand !== "clear") {
            if (!body)
                return client.channel.sendError(
                    message.channel,
                    "You must specify a new note body!"
                )
            if (body.length > 1024)
                return client.channel.sendError(
                    message.channel,
                    "That note is too long! (max. 1024 characters)."
                )
        }

        const note = await ModerationNote.findOne(user.id)

        if (!subcommand && !body) {
            const embed = {
                thumbnail: {
                    url: user.displayAvatarURL({ size: 64, format: "png", dynamic: true })
                },
                description: note
                    ? `Here are ${user}'s moderation notes (you can also read them with \`${client.config.prefix}check @${user.tag}\`):\n\n${note.body}\n\u200B`
                    : `✨ No moderation notes found for ${user} (${user.tag}).`,
                fields: []
            }
            if (note)
                embed.fields.push(
                    {
                        name: "Updated by",
                        value: note.updaters.map(id => `<@${id}>`).join(", "),
                        inline: true
                    },
                    {
                        name: "Last updated",
                        value: formatTimestamp(note.updatedAt, "R"),
                        inline: true
                    }
                )
            await client.channel.sendSuccess(message.channel, embed)
        } else if (!subcommand || subcommand === "add") {
            if (!body)
                return client.channel.sendError(
                    message.channel,
                    "You must specify the note's body!"
                )

            if (note) {
                const tip = body.length <= 1024 ? " (Overwrite it with `note edit`)." : ""
                note.body += `\n${body}`
                if (note.body.length > 1024)
                    return client.channel.sendError(
                        message.channel,
                        `Appending to this note would exceed the character limit!${tip}`
                    )
                if (!note.updaters.includes(message.author.id))
                    note.updaters.push(message.author.id)

                await note.save()
                await client.channel.sendSuccess(
                    message.channel,
                    `Updated ${user}'s notes!`
                )
            } else {
                const newNote = new ModerationNote()
                newNote.member = user.id
                newNote.body = body
                newNote.updaters = [message.author.id]
                await newNote.save()
                await client.channel.sendSuccess(
                    message.channel,
                    `Created ${user}'s notes!`
                )
            }
        } else if (subcommand === "edit") {
            if (!note) {
                return client.channel.sendError(
                    message.channel,
                    `${user} doesn't have any notes! (Add them with \`${client.config.prefix}note add\`)`
                )
            }
            note.body = body
            if (!note.updaters.includes(message.author.id))
                note.updaters.push(message.author.id)

            await note.save()
            await client.channel.sendSuccess(message.channel, `Updated ${user}'s notes!`)
        } else if (subcommand === "clear") {
            await note.remove()
            await client.channel.sendSuccess(message.channel, `Cleared ${user}'s notes!`)
        }
    }
})
