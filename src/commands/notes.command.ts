import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Discord from "discord.js"

import ModerationNote from "../entities/ModerationNote.entity.js"
import CommandMessage from "../struct/CommandMessage.js"
import { formatTimestamp } from "@buildtheearth/bot-utils"

export default new Command({
    name: "notes",
    aliases: [],
    description: "Read and manage moderation notes.",
    permission: [
        globalThis.client.roles.HELPER,
        globalThis.client.roles.MODERATOR,
        globalThis.client.roles.MANAGER
    ],
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
        const user = await args.consumeUser("member")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")
        const body = args.consumeRest(["body"])
        if (subcommand && subcommand !== "clear" && subcommand !== "check") {
            if (!body) return message.sendErrorMessage("noBody")
            if (body.length > 1024) return message.sendErrorMessage("noteTooLong1024")
        }

        await message.continue()

        const note = await ModerationNote.findOne(user.id)

        if ((!subcommand && !body) || (subcommand === "check" && !body)) {
            const embed = <Discord.APIEmbed>{
                thumbnail: {
                    url: user.displayAvatarURL({
                        size: 64,
                        extension: "png",
                        forceStatic: false
                    })
                },
                description: note
                    ? `Here are ${user}'s moderation notes (you can also read them with \`${client.config.prefix}check @${user.tag}\`):\n\n${note.body}\n\u200B`
                    : `✨ No moderation notes found for ${user} (${user.tag}).`,
                fields: []
            }
            if (note)
                embed.fields?.push(
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
            await message.sendSuccess(embed)
        } else if (!subcommand || subcommand === "add") {
            if (!body) return message.sendErrorMessage("noBody")

            if (note) {
                const tip = body.length <= 1024 ? " (Overwrite it with `note edit`)." : ""
                note.body += `\n${body}`
                if (note.body.length > 1024)
                    return message.sendErrorMessage("appendOverflow", tip)
                if (!note.updaters.includes(message.member.id))
                    note.updaters.push(message.member.id)

                await note.save()
                await message.sendSuccessMessage("updatedNotes", user)
            } else {
                const newNote = new ModerationNote()
                newNote.member = user.id
                newNote.body = body
                newNote.updaters = [message.member.id]
                await newNote.save()
                await message.sendSuccessMessage("createdNotes", user)
            }
        } else if (subcommand === "edit") {
            if (!note) {
                return message.sendErrorMessage("noNotes", user)
            }
            note.body = body
            if (!note.updaters.includes(message.member.id))
                note.updaters.push(message.member.id)

            await note.save()
            await message.sendSuccessMessage("updatedNotes", user)
        } else if (subcommand === "clear") {
            await note?.remove()
            await message.sendSuccessMessage("clearnedNotes", user)
        }
    }
})
