import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import ModerationNote from "../entities/ModerationNote"
import formatTimestamp from "../util/formatTimestamp"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "notes",
    aliases: ["note", "modnotes", "modnote"],
    description: "Read and manage moderation notes.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    args: [
        {
            name: "member",
            description: "Member to annotate.",
            required: true,
            optionType: "USER"
        },
        {
            name: "body",
            description: "Note body.",
            required: false,
            optionType: "STRING"
        }
    ],

    basesubcommand: "check",
    subcommands: [
        {
            name: "add",
            description: "Add (or append to) the notes for a member.",
            args: [
                {
                    name: "member",
                    description: "Member to annotate.",
                    required: true,
                    optionType: "USER"
                },
                {
                    name: "body",
                    description: "Note body.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "edit",
            description: "Edit the notes for a member (overwriting the existing ones).",
            args: [
                {
                    name: "member",
                    description: "Member to annotate.",
                    required: true,
                    optionType: "USER"
                },
                {
                    name: "body",
                    description: "Note body.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "clear",
            description: "Delete the notes for a member.",
            args: [
                {
                    name: "member",
                    description: "Member to annotate.",
                    required: true,
                    optionType: "USER"
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(["add", "edit", "clear", "check"])
        const user = await args.consumeUser("member", true)
        if (!user)
            return client.response.sendError(
                message,
                user === undefined
                    ? "You must provide a user!"
                    : "Couldn't find that user."
            )
        const body = args.consumeRest(["body"])
        if (subcommand && subcommand !== "clear" && subcommand !== "check") {
            if (!body)
                return client.response.sendError(
                    message,
                    "You must specify a new note body!"
                )
            if (body.length > 1024)
                return client.response.sendError(
                    message,
                    "That note is too long! (max. 1024 characters)."
                )
        }

        await message.continue()

        const note = await ModerationNote.findOne(user.id)

        if ((!subcommand && !body) || (subcommand === "check" && !body)) {
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
            await client.response.sendSuccess(message, embed)
        } else if (!subcommand || subcommand === "add") {
            if (!body)
                return client.response.sendError(
                    message,
                    "You must specify the note's body!"
                )

            if (note) {
                const tip = body.length <= 1024 ? " (Overwrite it with `note edit`)." : ""
                note.body += `\n${body}`
                if (note.body.length > 1024)
                    return client.response.sendError(
                        message,
                        `Appending to this note would exceed the character limit!${tip}`
                    )
                if (!note.updaters.includes(message.member.id))
                    note.updaters.push(message.member.id)

                await note.save()
                await client.response.sendSuccess(message, `Updated ${user}'s notes!`)
            } else {
                const newNote = new ModerationNote()
                newNote.member = user.id
                newNote.body = body
                newNote.updaters = [message.member.id]
                await newNote.save()
                await client.response.sendSuccess(message, `Created ${user}'s notes!`)
            }
        } else if (subcommand === "edit") {
            if (!note) {
                return client.response.sendError(
                    message,
                    `${user} doesn't have any notes! (Add them with \`${client.config.prefix}note add\`)`
                )
            }
            note.body = body
            if (!note.updaters.includes(message.member.id))
                note.updaters.push(message.member.id)

            await note.save()
            await client.response.sendSuccess(message, `Updated ${user}'s notes!`)
        } else if (subcommand === "clear") {
            await note.remove()
            await client.response.sendSuccess(message, `Cleared ${user}'s notes!`)
        }
    }
})
