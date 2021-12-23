import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import { Brackets, WhereExpression } from "typeorm"
import Snippet from "../entities/Snippet"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "team",
    aliases: ["buildteam", "bt", "invite"],
    description: "Get an invite for a build team.",
    permission: Roles.ANY,
    args: [
        {
            name: "team",
            description: "Team to get",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const input = args.consumeRest(["team"]).toLowerCase()
        if (!input) return client.response.sendError(message, "Please give a team name")

        await message.continue()

        const Snippets = Snippet.getRepository()
        const language = "en"
        const find = (query: WhereExpression) =>
            query
                .where("snippet.name = :name", { name: input })
                .andWhere("snippet.type = 'team'")
                .orWhere(
                    new Brackets(qb => {
                        qb.where("FIND_IN_SET(:name, snippet.aliases)").andWhere(
                            "snippet.type = 'team'"
                        )
                    })
                )
        const snippet = await Snippets.createQueryBuilder("snippet")
            .where("snippet.language = :language", { language })
            .andWhere(new Brackets(find))
            .getOne()

        if (!snippet) {
            return client.response.sendError(
                message,
                `This team does not exist, try searching on build team interactive map or the website (=map)`
            )
        } else {
            return message
                .send({ content: snippet.body, allowedMentions: { parse: [] } })
                .catch(() => null)
        }
    }
})
