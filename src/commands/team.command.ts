import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import typeorm from "typeorm"
import Snippet from "../entities/Snippet.entity.js"
import CommandMessage from "../struct/CommandMessage.js"
import Discord from "discord.js"

export default new Command({
    name: "team",
    aliases: ["bt"],
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
        if (!input) return client.response.sendError(message, message.messages.noTeam)
        await message.continue()
        return await runBtCommand(client, message, input)
    }
})

export async function runBtCommand(
    client: Client,
    message: CommandMessage | Discord.Message,
    arg: string
): Promise<unknown> {
    const Snippets = Snippet.getRepository()
    const language = "en"
    const find = (query: typeorm.WhereExpression) =>
        query
            .where("snippet.name = :name", { name: arg })
            .andWhere("snippet.type = 'team'")
            .orWhere(
                new typeorm.Brackets(qb => {
                    qb.where("FIND_IN_SET(:name, snippet.aliases)").andWhere(
                        "snippet.type = 'team'"
                    )
                })
            )
    const snippet = await Snippets.createQueryBuilder("snippet")
        .where("snippet.language = :language", { language })
        .andWhere(new typeorm.Brackets(find))
        .getOne()

    let locale = "en_US"

    if (message instanceof CommandMessage) locale = message.locale

    if (!snippet) {
        return client.response.sendError(
            message,
            client.messages.getMessage("invalidTeam", locale)
        )
    } else {
        if (message instanceof CommandMessage)
            return message
                .send({ content: snippet.body, allowedMentions: { parse: [] } })
                .catch(() => null)
        else
            return message
                .reply({ content: snippet.body, allowedMentions: { parse: [] } })
                .catch(() => null)
    }
}
