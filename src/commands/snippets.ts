import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Snippet from "../entities/Snippet"
import Roles from "../util/roles"
import languages from "iso-639-1"

export default new Command({
    name: "snippets",
    aliases: ["tags"],
    description: "List and manage snippets.",
    permission: Roles.ANY,
    usage: "",
    subcommands: [
        {
            name: "add",
            description: "Add a snippet.",
            permission: [Roles.MANAGER, Roles.PR_TRANSLATION_TEAM],
            usage: "<name> <language> <body>"
        },
        {
            name: "edit",
            description: "Edit a snippet.",
            permission: [Roles.MANAGER, Roles.PR_TRANSLATION_TEAM],
            usage: "<name> <language> <body>"
        },
        {
            name: "delete",
            description: "Delete a snippet.",
            permission: Roles.MANAGER,
            usage: "<name> <language>"
        }
    ],
    async run(this: Command, client: Client, message: Message, args: Args) {
        const subcommand = args.consume().toLowerCase()

        if (subcommand === "list" || !subcommand) {
            const snippets = await Snippet.find()
            const snippetLanguages: { [key: string]: string[] } = {}

            for (const snippet of snippets) {
                if (snippetLanguages[snippet.name]) {
                    snippetLanguages[snippet.name].push(snippet.language)
                } else {
                    snippetLanguages[snippet.name] = [snippet.language]
                }
            }

            let list = ""
            for (const [snippet, languages] of Object.entries(snippetLanguages)) {
                list += `•   ${snippet} (${languages.join(", ")})`
            }

            message.channel.sendSuccess({
                author: { name: "Snippet list" },
                description: list
            })
        } else if (subcommand === "add" || subcommand === "edit") {
            // prettier-ignore
            if (!message.member.hasStaffPermission([Roles.MANAGER, Roles.PR_TRANSLATION_TEAM]))
                return

            const name = args.consume().toLowerCase()
            const language = args.consume().toLowerCase()
            const body = args.consumeRest()
            if (!name)
                return message.channel.sendError("You must specify a snippet name.")

            const languageName = languages.getName(language)
            if (!languageName)
                return message.channel.sendError(
                    "You must specify a valid snippet language."
                )

            let snippet: Snippet
            if (subcommand === "add") {
                const existingSnippet = await Snippet.findOne({
                    where: { name, language }
                })
                if (existingSnippet)
                    return message.channel.sendError("That snippet already exists!")

                snippet = new Snippet()
                snippet.name = name
                snippet.language = language
            } else if (subcommand === "edit") {
                snippet = await Snippet.findOne({ where: { name, language } })
                if (!snippet)
                    return message.channel.sendError("That snippet doesn't exist!")
                if (snippet.body === body)
                    return message.channel.sendSuccess("Nothing changed.")
            }

            if (!body)
                return message.channel.sendError("You must specify a snippet body.")
            snippet.body = body
            await snippet.save()

            const past = subcommand === "add" ? "Added" : "Edited"
            message.channel.sendSuccess(`${past} **${name}** snippet in ${languageName}.`)
        } else if (subcommand === "delete") {
            if (!message.member.hasStaffPermission(Roles.MANAGER)) return

            const name = args.consume().toLowerCase()
            const language = args.consume().toLowerCase()
            if (!name)
                return message.channel.sendError("You must specify a snippet name.")

            const languageName = languages.getName(language)
            if (!languageName)
                // prettier-ignore
                return message.channel.sendError("You must specify a valid snippet language.")

            const snippet = await Snippet.findOne({ where: { name, language } })
            if (!snippet) return message.channel.sendError("That snippet doesn't exist!")

            await snippet.remove()
            message.channel.sendSuccess(`Deleted **${name}** snippet in ${languageName}.`)
        }
    }
})
