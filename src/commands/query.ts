import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import Roles from "../util/roles"
import truncateString from "../util/truncateString"

export default new Command({
    name: "query",
    aliases: ["sql"],
    description: "Evaluate an SQL query.",
    permission: Roles.BOT_DEVELOPER,
    usage: "<query>",
    async run(this: Command, client: Client, message: Message, args: string) {
        const query = args.replace(/^`(``)?(sql)?/, "").replace(/`(``)?$/, "")
        try {
            const out = JSON.stringify(await client.db.query(query), null, 2)
            message.channel.sendSuccess({
                author: { name: "Output" },
                description: `\`\`\`${truncateString(out, 1994)}\`\`\``
            })
        } catch (error) {
            const err = error.message || "\u200B"
            message.channel.sendError({
                author: { name: "Error" },
                description: `\`\`\`${truncateString(err, 1994)}\`\`\``
            })
        }
    }
})
