import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import Snippet from "../entities/Snippet"
import Roles from "../util/roles"

export default new Command({
    name: "snippets",
    aliases: ["tags"],
    description: "List and manage snippets.",
    permission: Roles.ANY,
    usage: "",
    async run(this: Command, client: Client, message: Message, args: string) {
        const subcommand = args.split(" ")[0].toLowerCase().trim()
        args = args.split(" ").slice(1).join(" ").trim()

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
        } else if (subcommand === "add") {
            if (!message.member.hasStaffPermission(Roles.MANAGER)) return

            const name = args.split(/ +/)[0] || ""
            const language = args.split(/ +/)[1] || ""
            const body = args.replace(name, "").replace(language, "").trim()

            if (!name)
                return message.channel.sendError("You must specify a snippet name.")

            const existingSnippet = await Snippet.findOne({ where: { name, language } })
            if (existingSnippet)
                return message.channel.sendError("That snippet already exists!")

            if (language.length !== 2)
                // prettier-ignore
                return message.channel.sendError("You must specify a valid snippet language.")
            if (!body)
                return message.channel.sendError("You must specify a snippet body.")

            const snippet = new Snippet()
            snippet.name = name
            snippet.language = language
            snippet.body = body
            await snippet.save()

            message.channel.sendSuccess(
                `Created \`${name}\` snippet with language \`${language}\`.`
            )
        }
    }
})
