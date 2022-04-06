import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import typeorm from "typeorm"
import languages from "../struct/client/iso6391.js"
import Snippet from "../entities/Snippet.entity.js"
import CommandMessage from "../struct/CommandMessage.js"
import { quote } from "@buildtheearth/bot-utils"

export default new Command({
    name: "rule",
    aliases: [],
    description: "Get a rule's text.",
    permission: globalThis.client.roles.ANY,
    args: [
        {
            name: "number",
            description: "Rule Number.",
            optionType: "NUMBER",
            required: true
        },
        {
            name: "language",
            description: "Rule language.",
            optionType: "STRING",
            required: false
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const query = args.consume("number").toLowerCase()
        const number = Number(query)
        //let rule: string

        if (Number.isInteger(number) || Number.isFinite(number)) {
            if (number < 1) return message.sendErrorMessage("invalidNumber")

            const Snippets = Snippet.getRepository()
            const firstArg = args.consume("language").toLowerCase()
            const languageName = languages.getName(firstArg) || "English"
            const language = languages.validate(firstArg) ? firstArg.toLowerCase() : "en"

            if (firstArg.toLowerCase() === "zh") return message.sendErrorMessage("zhLang")

            await message.continue()

            const find = (query: typeorm.WhereExpression) =>
                query
                    .where("snippet.name = :name", { name: number })
                    .andWhere("snippet.type = 'rule'")
                    .orWhere(
                        new typeorm.Brackets(qb => {
                            qb.where("FIND_IN_SET(:name, snippet.aliases)").andWhere(
                                "snippet.type = 'rule'"
                            )
                        })
                    )

            const snippet = await Snippets.createQueryBuilder("snippet")
                .where("snippet.language = :language", { language })
                .andWhere(new typeorm.Brackets(find))
                .getOne()

            if (!snippet) {
                const unlocalizedSnippet = await Snippets.createQueryBuilder("snippet")
                    .where(new typeorm.Brackets(find))
                    .andWhere("snippet.type = 'rule'")
                    .getOne()
                if (unlocalizedSnippet)
                    message.sendErrorMessage(
                        "ruleNotTranslated",
                        args.command,
                        languageName
                    )
                else {
                    return message.sendErrorMessage("theyDontKnowTheRules")
                }
            } else {
                return message
                    .send({
                        content: quote(snippet.body),
                        allowedMentions: { parse: [] }
                    })
                    .catch(() => null)
            }
        } else {
            return message.sendErrorMessage("pleaseValid")
        }
    }
})
