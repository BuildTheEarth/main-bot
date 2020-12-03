import Discord from "discord.js"
import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "eval",
    aliases: ["run"],
    description: "Evaluate JavaScript code.",
    permission: Roles.BOT_DEVELOPER,
    usage: "<code>",
    async run(_client: Client, message: Discord.Message, args: string) {
        const code = args.replace(/(^`(``)?(js)?|`(``)?$)/, "")
        try {
            const out = String(await eval(code)) || "\u200B"
            const truncated = out.length > 1992 ? out.slice(0, 1989) + "..." : out
            message.channel.send(`\`\`\`js\n${truncated}\n\`\`\``)
        } catch (error) {
            const msg = error.message || "\u200B"
            const truncated = msg.length > 1994 ? msg.slice(0, 1991) + "..." : msg
            message.channel.send(`\`\`\`${truncated}\`\`\``)
        }
    }
})
