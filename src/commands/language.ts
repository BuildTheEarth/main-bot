import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"

const LANGUAGE_ROLES = {
    english: "English",
    espanol: "Español",
    francais: "Français",
    deutsch: "Deutsch",
    russian: "Pусский",
    portuguese: "Português",
    italian: "Italiana",
    international: "Ø",
    chinese: "中文"
}

export default new Command({
    name: "language",
    aliases: ["lang"],
    description: "Give a member a language role.",
    permission: [Roles.SUPPORT, Roles.HELPER],
    usage: "<member> <language>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to give a language role to!"
                    : "Couldn't find that user."
            )

        const member = message.guild.member(user)
        if (!member) return message.channel.sendError("The user is not in the server!")

        const languageInput = args.consume().toLowerCase()
        const language = LANGUAGE_ROLES[languageInput]
        if (!language)
            return message.channel.sendError(
                languageInput ? "That's not a language!" : "You must provide a language!"
            )

        const role = message.guild.roles.cache.find(r => r.name === language)
        await member.roles.add(role)
        await message.channel.sendSuccess("Role added!")
    }
})
