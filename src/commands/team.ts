import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import Discord from "discord.js"
import { Brackets, WhereExpression } from "typeorm"
import Snippet from "../entities/Snippet"

export default new Command({
    name: "team",
    aliases: ["buildteam", "bt", "invite"],
    description: "Get an invite for a build team.",
    permission: Roles.ANY,
    usage: "<team>",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const input = args.consumeRest().toLowerCase()
        if (!input)
            return client.channel.sendError(message.channel, "Please give a team name")
        const Snippets = Snippet.getRepository()
        const language = "en"
        const find = (query: WhereExpression) =>
            query
                .where("snippet.name = :name", { name: input })
                .andWhere("snippet.type = 'team'")
                .orWhere("INSTR(snippet.aliases, CONCAT(:name, ','))")
                .orWhere("INSTR(snippet.aliases, CONCAT(',', :name))")
        const snippet = await Snippets.createQueryBuilder("snippet")
            .where("snippet.language = :language", { language })
            .andWhere(new Brackets(find))
            .getOne()

        if (!snippet) {
            return client.channel.sendError(message.channel, `This team does not exist .`)
        } else {
            return message.channel
                .send({ content: snippet.body, allowedMentions: { parse: [] } })
                .catch(() => null)
        }
    }
})
