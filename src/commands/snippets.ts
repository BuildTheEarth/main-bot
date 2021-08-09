import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Snippet from "../entities/Snippet"
import Roles from "../util/roles"
import languages from "../util/patchedISO6391"
import hexToRGB from "../util/hexToRGB"
import GuildMember from "../struct/discord/GuildMember"
import Discord from "discord.js"

export default new Command({
    name: "snippets",
    aliases: ["snippet", "tags"],
    description: "List and manage snippets.",
    permission: Roles.ANY,
    usage: "",
    subcommands: [
        {
            name: "add",
            description: "Add a snippet.",
            permission: [Roles.SUPPORT, Roles.MANAGER, Roles.PR_TRANSLATION_TEAM],
            usage: "<name> <language> <body>"
        },
        {
            name: "edit",
            description: "Edit a snippet.",
            permission: [Roles.SUPPORT, Roles.MANAGER, Roles.PR_TRANSLATION_TEAM],
            usage: "<name> <language> <body>"
        },
        {
            name: "delete",
            description: "Delete a snippet.",
            permission: [Roles.SUPPORT, Roles.MANAGER],
            usage: "<name> <language>"
        },
        {
            name: "source",
            description: "Get the source response of a specific snippet.",
            permission: Roles.ANY,
            usage: "<name> <language>"
        },
        {
            name: "aliases",
            description: "Add aliases to a snippet",
            permission: [Roles.SUPPORT, Roles.MANAGER],
            usage: "<list | add | delete> <name> <language> [alias]"
        }
    ],
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const subcommand = args.consume().toLowerCase()

        if (subcommand === "list" || !subcommand) {
            const snippets = await Snippet.find()
            const tidy: Record<string, { aliases: string[]; languages: string[] }> = {}

            for (const snippet of snippets) {
                if (!tidy[snippet.name])
                    tidy[snippet.name] = { aliases: [], languages: [] }

                if (snippet.aliases) tidy[snippet.name].aliases.push(...snippet.aliases)
                tidy[snippet.name].languages.push(snippet.language)
            }

            let list = ""
            for (const [name, { aliases, languages }] of Object.entries(tidy)) {
                languages.sort()
                const triggers = [name, ...aliases].join(" / ")
                const onlyEnglish = languages.length === 1 && languages[0] === "en"
                const languageList = onlyEnglish ? "" : ` (${languages.join(", ")})`
                list += `• \u200B \u200B ${triggers}${languageList}\n`
            }

            return client.channel.sendSuccess(message.channel, {
                author: { name: "Snippet list" },
                description: list
            })
        } else if (subcommand === "aliases") {
            const [action, name, language] = args.consume(3)
            const languageName = languages.getName(language)
            if (!name)
                return client.channel.sendError(
                    message.channel,
                    "You must specify a snippet name."
                )
            if (!languageName)
                return client.channel.sendError(
                    message.channel,
                    "You must specify a valid snippet language."
                )

            const snippet = await Snippet.findOne({ name, language })
            if (!snippet)
                return client.channel.sendError(
                    message.channel,
                    "That snippet doesn't exist!"
                )
            if (action === "list") {
                const list =
                    snippet.aliases.map(alias => `• \u200B \u200B ${alias}`).join("\n") ||
                    "*No aliases.*"
                return client.channel.sendSuccess(message.channel, list)
            }

            const alias = args.consume().toLowerCase()
            if (!alias)
                return client.channel.sendError(
                    message.channel,
                    "You must specify an alias!"
                )
            if (action === "add") {
                if (!snippet.aliases) snippet.aliases = []
                snippet.aliases.push(alias)
                await snippet.save()
                return client.channel.sendSuccess(
                    message.channel,
                    `Added alias **${alias}** to **${name}** snippet in ${languageName}.`
                )
            } else if (action === "delete") {
                if (!snippet.aliases.includes(alias))
                    return client.channel.sendError(
                        message.channel,
                        "That snippet does not have this alias!"
                    )

                snippet.aliases.splice(snippet.aliases.indexOf(alias), 1)
                await snippet.save()
                return client.channel.sendSuccess(
                    message.channel,
                    `Removed the **${alias}** alias from **${name}** snippet in ${languageName}.`
                )
            }
        }

        const editPermissions = [Roles.SUPPORT, Roles.MANAGER, Roles.PR_TRANSLATION_TEAM]
        const deletePermissions = [Roles.SUPPORT, Roles.MANAGER]
        if (!GuildMember.hasRole(message.member, editPermissions)) return
        const canDelete = GuildMember.hasRole(message.member, deletePermissions)
        if (subcommand === "delete" && !canDelete) return

        const name = args.consume().toLowerCase()
        const language = args.consume().toLowerCase()
        const languageName = languages.getName(language)
        if (!name)
            return client.channel.sendError(
                message.channel,
                "You must specify a snippet name."
            )
        if (!languageName)
            return client.channel.sendError(
                message.channel,
                "You must specify a valid snippet language."
            )

        const existingSnippet = await Snippet.findOne({ name, language })

        if (subcommand === "add" || subcommand === "edit") {
            const body = args.consumeRest()
            let snippet: Snippet
            if (!body)
                return client.channel.sendError(
                    message.channel,
                    "You must specify a snippet body."
                )

            if (subcommand === "add") {
                if (client.commands.search(name))
                    return client.channel.sendError(
                        message.channel,
                        "That snippet name is already used by a command."
                    )
                if (existingSnippet)
                    return client.channel.sendError(
                        message.channel,
                        "That snippet already exists!"
                    )
                snippet = new Snippet()
                snippet.name = name
                snippet.language = language
                snippet.aliases = []
            } else if (subcommand === "edit") {
                if (!existingSnippet)
                    return client.channel.sendError(
                        message.channel,
                        "That snippet doesn't exist!"
                    )
                if (existingSnippet.body === body)
                    return client.channel.sendError(message.channel, "Nothing changed.")
                snippet = existingSnippet
            }

            snippet.body = body
            await snippet.save()
            const past = subcommand === "add" ? "Added" : "Edited"
            // prettier-ignore
            await client.channel.sendSuccess(message.channel, `${past} **${name}** snippet in ${languageName}.`)
            await client.log(snippet, subcommand, message.author)
        } else if (subcommand === "delete") {
            if (!existingSnippet)
                return client.channel.sendError(
                    message.channel,
                    "That snippet doesn't exist!"
                )

            await existingSnippet.remove()
            // prettier-ignore
            await client.channel.sendSuccess(message.channel, `Deleted **${name}** snippet in ${languageName}.`)
            await client.log(existingSnippet, "delete", message.author)
        } else if (subcommand === "source") {
            if (!existingSnippet)
                return client.channel.sendError(
                    message.channel,
                    "That snippet doesn't exist!"
                )
            await message.channel.send({
                embeds: [
                    {
                        color: hexToRGB(client.config.colors.info),
                        description:
                            `The **${existingSnippet.name}** snippet responds with ` +
                            `the following text in ${languageName}:` +
                            `\n\`\`\`${existingSnippet.body}\`\`\``
                    }
                ]
            })
        }
    }
})
