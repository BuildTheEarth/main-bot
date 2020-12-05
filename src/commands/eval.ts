import Message from "../struct/discord/Message"
import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import truncateString from "../util/truncateString"

export default new Command({
    name: "eval",
    aliases: ["run"],
    description: "Evaluate JavaScript code.",
    permission: Roles.BOT_DEVELOPER,
    usage: "<code>",
    async run(this: Command, client: Client, message: Message, args: string) {
        const code = args.replace(/^`(``)?(js)?/, "").replace(/`(``)?$/, "")
        try {
            const out = String(await eval(code)) || "\u200B"
            message.channel.send(`\`\`\`js\n${truncateString(out, 1990)}\n\`\`\``)
        } catch (error) {
            const err = error.message || "\u200B"
            message.channel.send(`\`\`\`${truncateString(err, 1994)}\`\`\``)
        }
    }
})
