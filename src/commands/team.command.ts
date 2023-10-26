import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import typeorm from "typeorm"
import Snippet from "../entities/Snippet.entity.js"
import CommandMessage from "../struct/CommandMessage.js"
import Discord from "discord.js"
import interactionCreateEvent from "../events/interactionCreate.event.js"
import { noop } from "@buildtheearth/bot-utils"
import CommandAction from "../entities/CommandAction.entity.js"

export default new Command({
    name: "team",
    aliases: ["bt"],
    description: "Get an invite for a build team.",
    permission: globalThis.client.roles.ANY,
    args: [
        {
            name: "team",
            description: "Team to get",
            required: true,
            optionType: "STRING",
            autocomplete: {
                enable: true,
                handler: handleBtAuto
            }
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const input = args.consumeRest(["team"]).toLowerCase()
        if (!input) return message.sendErrorMessage("noTeam")
        await message.continue()
        return await runBtCommand(client, message, input)
    }
})

export async function handleBtAuto(
    _client: Client,
    autocomplete: Discord.AutocompleteInteraction
): Promise<void> {
    const focusedOption = autocomplete.options.getFocused(true)
    const val = focusedOption.value

    const possibles = Snippet.teams
        .filter(v => v.includes(val))
        .slice(0, 25)
        .map(v => {
            return { name: v, value: v }
        })

    autocomplete.respond(possibles).catch(noop)
}

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

    let locale = "en-US"

    if (message instanceof CommandMessage) locale = message.locale

    if (!snippet) {
        return client.response.sendError(
            message,
            client.messages.getMessage("invalidTeam", locale)
        )
    } else {
        if (message instanceof CommandMessage)
            message
                .send({ content: snippet.body, allowedMentions: { parse: [] } })
                .catch(() => null)
        else
            message
                .reply({ content: snippet.body, allowedMentions: { parse: [] } })
                .catch(() => null)

        const cInfo = new CommandAction()
        cInfo.channel = message.channel.id
        cInfo.command = "executed_team"
        cInfo.subcommand = snippet.language
        cInfo.subcommandGroup = snippet.name
        cInfo.guild = message.guild?.id ?? "00000000000000000"
        cInfo.executor = message.author.id
        await cInfo.save()
    }
}
