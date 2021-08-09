import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import truncateString from "../util/truncateString"
import Discord from "discord.js"

export default new Command({
    name: "query",
    aliases: ["sql"],
    description: "Evaluate an SQL query.",
    permission: Roles.BOT_DEVELOPER,
    usage: "<query>",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const query = args.removeCodeblock()

        try {
            const out = JSON.stringify(await client.db.query(query), null, 2)
            client.channel.sendSuccess(message.channel, {
                author: { name: "Output" },
                description: `\`\`\`${truncateString(out, 1994)}\`\`\``
            })
        } catch (error) {
            const err = error.message || "\u200B"
            client.channel.sendError(message.channel, {
                author: { name: "Error" },
                description: `\`\`\`${truncateString(err, 1994)}\`\`\``
            })
        }
    }
})
