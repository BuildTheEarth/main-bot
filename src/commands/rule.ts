import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import quote from "../util/quote"
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
        let rule: string

        if (Number.isInteger(number)) {
            if (number < 1)
                return client.channel.sendError(
                    message.channel,
                    "That's not a valid number."
                )

            const count = client.config.rules.length
            if (number > count)
                return client.channel.sendError(
                    message.channel,
                    `There are only ${count} rules.`
                )
            rule = client.config.rules[number - 1]
        } else {
            rule = client.config.rules.find(rule => rule.toLowerCase().includes(query))
            if (!rule)
                return client.channel.sendError(
                    message.channel,
                    `Couldn't find that rule.`
                )
        }

        message.channel.send({ content: quote(rule), allowedMentions: { parse: [] } })
    }
})
