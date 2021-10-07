import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import quote from "../util/quote"
import { Brackets, WhereExpression } from "typeorm"
import languages from "../util/patchedISO6391"
import Snippet from "../entities/Snippet"
import Discord from "discord.js"

export default new Command({
    name: "rule",
    aliases: ["rules"],
    description: "Get a rule's text.",
    permission: Roles.ANY,
    usage: "<number | text>",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const query = args.consume().toLowerCase()
        const number = Number(query)
        //let rule: string

        if (Number.isInteger(number) || Number.isFinite(number)) {
            if (number < 1)
                return client.channel.sendError(
                    message.channel,
                    "That's not a valid number."
                )

            const Snippets = Snippet.getRepository()
            const firstArg = args.consume().toLowerCase()
            const languageName = languages.getName(firstArg) || "English"
            const language = languages.validate(firstArg) ? firstArg.toLowerCase() : "en"

            if (firstArg.toLowerCase() === "zh")
                return client.channel.sendError(
                    message.channel,
                    `Please choose \`zh-s\` (简体中文) or \`zh-t\` (繁體中文)!`
                )

            const find = (query: WhereExpression) =>
                query
                    .where("snippet.name = :name", { name: number })
                    .andWhere("snippet.type = 'rule'")
                    .orWhere("INSTR(snippet.aliases, :name)")

            const snippet = await Snippets.createQueryBuilder("snippet")
                .where("snippet.language = :language", { language })
                .andWhere(new Brackets(find))
                .getOne()

            if (!snippet) {
                const unlocalizedSnippet = await Snippets.createQueryBuilder("snippet")
                    .where(new Brackets(find))
                    .andWhere("snippet.type = 'rule'")
                    .getOne()
                if (unlocalizedSnippet)
                    client.channel.sendError(
                        message.channel,
                        `The **${args.command}** rule hasn't been translated to ${languageName} yet.`
                    )
                else {
                    return client.channel.sendError(
                        message.channel,
                        `This rule dosent exist.`
                    )
                }
            } else {
                return message.channel
                    .send({
                        content: quote(snippet.body),
                        allowedMentions: { parse: [] }
                    })
                    .catch(() => null)
            }
        } else {
            return client.channel.sendError(
                message.channel,
                `Valid input please!`
            )
        }
    }
})
