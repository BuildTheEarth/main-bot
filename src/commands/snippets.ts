import Discord from "discord.js"
import Client from "../struct/Client"
import Command from "../struct/Command"
import Snippet from "../entities/Snippet"
import Roles from "../util/roles"

export default new Command({
    name: "snippets",
    aliases: ["tags"],
    description: "List and manage snippets.",
    permission: Roles.ANY,
    usage: "",
    async run(this: Command, client: Client, message: Discord.Message, args: string) {
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

            message.channel.send({
                embed: {
                    color: client.config.colors.success,
                    author: { name: "Snippet list" },
                    description: list
                }
            })
        } else if (subcommand === "add") {
            const name = args.split(" ")[0]
            const language = args.split(" ")[1]
            const body = args.split(" ").slice(2).join(" ")

            if (language.length !== 2)
                return message.channel.send({
                    embed: {
                        color: client.config.colors.error,
                        description: "You must specify a valid snippet language."
                    }
                })

            const snippet = new Snippet()
            snippet.name = name
            snippet.language = language
            snippet.body = body
            await snippet.save()

            message.channel.send({
                embed: {
                    color: client.config.colors.success,
                    description: `Created \`${name}\` snippet with language \`${language}\`.`
                }
            })
        }
    }
})
