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
        },
        {
            name: " Source",
            description: "Get the source response of a specific snippet.",
            permission: Roles.ANY,
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
            for (const [snippet, languages] of Object.entries(snippetLanguages))
                list += `• \u200B \u200B ${snippet} (${languages.join(", ")})\n`

            return message.channel.sendSuccess({
                author: { name: "Snippet list" },
                description: list
            })
        }

        const editPermissions = [Roles.MANAGER, Roles.PR_TRANSLATION_TEAM]
        const deletePermissions = Roles.MANAGER
        if (!message.member.hasStaffPermission(editPermissions)) return
        const canDelete = message.member.hasStaffPermission(deletePermissions)
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
            } else if (subcommand === "edit") {
                if (!existingSnippet)
                    return message.channel.sendError("That snippet doesn't exist!")
                if (existingSnippet.body === body)
                    return message.channel.sendSuccess("Nothing changed.")
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
            await message.channel.send({
                embed: {
                    color: client.config.colors.info,
                    description:
                        `The \`${existingSnippet.name}\` snippet responds with ` +
                        `the following text in **${languageName}**:` +
                        `\n\`\`\`${existingSnippet.body}\`\`\``
                }
            })
        }
    }
})
