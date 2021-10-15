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
            name: "list",
            description: "List all snippets.",
            permission: Roles.ANY,
            usage: "['date' ]"
        },
        {
            name: "add",
            description: "Add a snippet.",
            permission: [Roles.SUPPORT, Roles.MANAGER, Roles.PR_TRANSLATION_TEAM],
            usage: "['rules'| 'team'] <name> <language> <body>"
        },
        {
            name: "edit",
            description: "Edit a snippet.",
            permission: [Roles.SUPPORT, Roles.MANAGER, Roles.PR_TRANSLATION_TEAM],
            usage: "['rules' | 'team'] <name> <language> <body>"
        },
        {
            name: "delete",
            description: "Delete a snippet.",
            permission: [Roles.SUPPORT, Roles.MANAGER],
            usage: "['rules' | 'team'] <name> <language>"
        },
        {
            name: "source",
            description: "Get the source response of a specific snippet.",
            permission: Roles.ANY,
            usage: "['rules' | 'team'] <name> <language>"
        },
        {
            name: "aliases",
            description: "Add aliases to a snippet",
            permission: [Roles.SUPPORT, Roles.MANAGER],
            usage: "['rules' | 'team'] <list | add | delete> <name> <language> [alias]"
        }
    ],
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const rules = !!args.consumeIf(["rule", "rules"])

        const teams = !!args.consumeIf(["team", "teams"])

        const currType = (rules ? "rule" : teams ? "team" : "snippet") as
            | "snippet"
            | "rule"
            | "team"

        const subcommand = args.consume().toLowerCase()

        if (subcommand === "list" || !subcommand) {
            const sortMode = args.consume().toLowerCase()
            const snippets = await Snippet.find()
            const tidy: Record<
                string,
                { aliases: string[]; languages: string[]; type: string }
            > = {}

            for (const snippet of snippets) {
                if (snippet.type == currType) {
                    if (!tidy[snippet.name])
                        tidy[snippet.name] = {
                            aliases: [],
                            languages: [],
                            type: snippet.type
                        }

                    if (snippet.aliases)
                        tidy[snippet.name].aliases.push(...snippet.aliases)
                    tidy[snippet.name].languages.push(snippet.language)
                }
            }

            const sortedSnippets = Object.entries(tidy)

            if (sortMode.toLowerCase() != "date") {
                sortedSnippets.sort((a, b) => {
                    if (a[0] < b[0]) return -1
                    if (a[0] > b[0]) return 1
                    return 0
                })
            }

            let list = ""
            for (const [name, { aliases, languages, type }] of sortedSnippets) {
                if (type == currType) {
                    languages.sort()
                    const triggers = [name, ...aliases].join(" / ")
                    const onlyEnglish = languages.length === 1 && languages[0] === "en"
                    const languageList = onlyEnglish ? "" : ` (${languages.join(", ")})`
                    list += `• \u200B \u200B ${triggers}${languageList}\n`
                }
            }

            return client.channel.sendSuccess(message.channel, {
                author: { name: "Snippet list" },
                description: list
            })
        } else if (subcommand === "aliases") {
            if (rules) {
                return client.channel.sendError(
                    message.channel,
                    "Rules cant have aliases, what did you expect!"
                )
            }

            // eslint-disable-next-line prefer-const
            let [action, name, language] = args.consume(3)
            const languageName = languages.getName(language)
            if (!name)
                return client.channel.sendError(
                    message.channel,
                    "You must specify a snippet name."
                )
            if (!languageName && !teams)
                return client.channel.sendError(
                    message.channel,
                    "You must specify a valid snippet language."
                )
            if (languageName && teams) language = "en"
            if (!languageName && teams) language = "en"

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

            const alias = teams
                ? args.consumeRest().toLowerCase()
                : args.consume().toLowerCase()
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
                    `Added alias **${alias}** to **${name}** ${currType} in ${languageName}.`
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
                    `Removed the **${alias}** alias from **${name}** ${currType} in ${languageName}.`
                )
            }
        }

        const editPermissions = [Roles.SUPPORT, Roles.MANAGER, Roles.PR_TRANSLATION_TEAM]
        const deletePermissions = [Roles.SUPPORT, Roles.MANAGER]
        if (!GuildMember.hasRole(message.member, editPermissions)) return
        const canDelete = GuildMember.hasRole(message.member, deletePermissions)
        if (subcommand === "delete" && !canDelete) return

        const name = args.consume().toLowerCase()
        let language = args.consume().toLowerCase()
        const languageName = languages.getName(language)
        if (!name)
            return client.channel.sendError(
                message.channel,
                "You must specify a snippet name."
            )
        if (!languageName && !teams)
            return client.channel.sendError(
                message.channel,
                "You must specify a valid snippet language."
            )
        if (languageName && teams) language = "en"
        if (!languageName && teams) language = "en"

        const existingSnippet = await Snippet.findOne({
            name: name,
            language: language,
            type: currType
        })

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
                if (rules) {
                    if (Number.isNaN(Number(name))) {
                        return client.channel.sendError(
                            message.channel,
                            "Rules must have number names, did you think you could fool me?"
                        )
                    }
                }
                snippet = new Snippet()
                snippet.name = name
                snippet.language = language
                snippet.aliases = []
                snippet.type = currType
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
            await client.channel.sendSuccess(message.channel, `${past} **${name}** ${currType} in ${languageName}.`)
            await client.log(snippet, subcommand, message.author)
        } else if (subcommand === "delete") {
            if (!existingSnippet)
                return client.channel.sendError(
                    message.channel,
                    "That snippet doesn't exist!"
                )

            await existingSnippet.remove()
            // prettier-ignore
            await client.channel.sendSuccess(message.channel, `Deleted **${name}** ${currType} in ${languageName}.`)
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
                            `The **${existingSnippet.name}** ${currType} responds with ` +
                            `the following text in ${languageName}:` +
                            `\n\`\`\`${existingSnippet.body}\`\`\``
                    }
                ]
            })
        }
    }
})
