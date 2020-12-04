import Discord from "discord.js"
import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import truncateString from "../util/truncateString"

export default new Command({
    name: "query",
    aliases: ["sql"],
    description: "Evaluate an SQL query.",
    permission: Roles.BOT_DEVELOPER,
    usage: "<query>",
    async run(this: Command, client: Client, message: Discord.Message, args: string) {
        const query = args.replace(/^`(``)?(sql)?/, "").replace(/`(``)?$/, "")
        try {
            const out = JSON.stringify(await client.db.query(query), null, 2)
            message.channel.send(`\`\`\`\n${truncateString(out, 1990)}\n\`\`\``)
        } catch (error) {
            const err = error.message || "\u200B"
            message.channel.send(`\`\`\`${truncateString(err, 1994)}\`\`\``)
        }
    }
})
