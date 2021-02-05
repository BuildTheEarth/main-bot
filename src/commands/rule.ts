import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import quote from "../util/quote"

export default new Command({
    name: "rule",
    aliases: ["rules"],
    description: "Get a rule's text.",
    permission: Roles.ANY,
    usage: "<number | text>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const query = args.consume().toLowerCase()
        const number = Number(query)
        let rule: string

        if (Number.isInteger(number)) {
            if (number < 1) return message.channel.sendError("That's not a valid number.")

            const count = client.config.rules.length
            if (number > count)
                return message.channel.sendError(`There are only ${count} rules.`)
            rule = client.config.rules[number - 1]
        } else {
            rule = client.config.rules.find(rule => rule.toLowerCase().includes(query))
            if (!rule) return message.channel.sendError(`Couldn't find that rule.`)
        }

        message.channel.send(quote(rule))
    }
})
