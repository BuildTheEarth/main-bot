import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Snippet from "../entities/Snippet"
import Roles from "../util/roles"
import languages from "../util/patchedISO6391"

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
            permission: [Roles.MANAGER],
            usage: "<list | add | delete> <name> <language> [alias]"
        }
    ],
    async run(this: Command, client: Client, message: Message, args: Args) {
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

            return message.channel.sendSuccess({
                author: { name: "Snippet list" },
                description: list
            })
        } else if (subcommand === "aliases") {
            const [action, name, language] = args.consume(3)
            const languageName = languages.getName(language)
            if (!name)
                return message.channel.sendError("You must specify a snippet name.")
            if (!languageName)
                return message.channel.sendError(
                    "You must specify a valid snippet language."
                )

            const snippet = await Snippet.findOne({ name, language })
            if (!snippet) return message.channel.sendError("That snippet doesn't exist!")
            if (action === "list") {
                const list =
                    snippet.aliases.map(alias => `• \u200B \u200B ${alias}`).join("\n") ||
                    "*No aliases.*"
                return message.channel.sendSuccess(list)
            }

            const alias = args.consume().toLowerCase()
            if (!alias) return message.channel.sendError("You must specify an alias!")
            if (action === "add") {
                if (!snippet.aliases) snippet.aliases = []
                snippet.aliases.push(alias)
                await snippet.save()
                return message.channel.sendSuccess(
                    `Added alias **${alias}** to **${name}** snippet in ${languageName}.`
                )
            } else if (action === "delete") {
                if (!snippet.aliases.includes(alias))
                    return message.channel.sendError(
                        "That snippet does not have this alias!"
                    )

                snippet.aliases.splice(snippet.aliases.indexOf(alias), 1)
                await snippet.save()
                return message.channel.sendSuccess(
                    `Removed the **${alias}** alias from **${name}** snippet in ${languageName}.`
                )
            }
        }

        const editPermissions = [Roles.SUPPORT, Roles.MANAGER, Roles.PR_TRANSLATION_TEAM]
        const deletePermissions = [Roles.SUPPORT, Roles.MANAGER]
        if (!message.member.hasRole(editPermissions)) return
        const canDelete = message.member.hasRole(deletePermissions)
        if (subcommand === "delete" && !canDelete) return

        const name = args.consume().toLowerCase()
        const language = args.consume().toLowerCase()
        const languageName = languages.getName(language)
        if (!name) return message.channel.sendError("You must specify a snippet name.")
        if (!languageName)
            return message.channel.sendError("You must specify a valid snippet language.")

        const existingSnippet = await Snippet.findOne({ name, language })

        if (subcommand === "add" || subcommand === "edit") {
            const body = args.consumeRest()
            let snippet: Snippet
            if (!body)
                return message.channel.sendError("You must specify a snippet body.")

            if (subcommand === "add") {
                if (existingSnippet)
                    return message.channel.sendError("That snippet already exists!")
                snippet = new Snippet()
                snippet.name = name
                snippet.language = language
                snippet.aliases = []
            } else if (subcommand === "edit") {
                if (!existingSnippet)
                    return message.channel.sendError("That snippet doesn't exist!")
                if (existingSnippet.body === body)
                    return message.channel.sendError("Nothing changed.")
                snippet = existingSnippet
            }

            snippet.body = body
            await snippet.save()
            const past = subcommand === "add" ? "Added" : "Edited"
            // prettier-ignore
            await message.channel.sendSuccess(`${past} **${name}** snippet in ${languageName}.`)
            await client.log(snippet, subcommand, message.author)
        } else if (subcommand === "delete") {
            if (!existingSnippet)
                return message.channel.sendError("That snippet doesn't exist!")

            await existingSnippet.remove()
            // prettier-ignore
            await message.channel.sendSuccess(`Deleted **${name}** snippet in ${languageName}.`)
            await client.log(existingSnippet, "delete", message.author)
        } else if (subcommand === "source") {
            if (!existingSnippet)
                return message.channel.sendError("That snippet doesn't exist!")
            await message.channel.send({
                embed: {
                    color: client.config.colors.info,
                    description:
                        `The **${existingSnippet.name}** snippet responds with ` +
                        `the following text in ${languageName}:` +
                        `\n\`\`\`${existingSnippet.body}\`\`\``
                }
            })
        }
    }
})
