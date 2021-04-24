import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import noop from "../util/noop"

const LANGUAGE_ROLES = {
    english: "English",
    en: "English",
    espanol: "Español",
    español: "Español",
    spanish: "Español",
    es: "Español",
    francais: "Français",
    français: "Français",
    french: "Français",
    fr: "Français",
    deutsch: "Deutsch",
    german: "Deutsch",
    de: "Deutsch",
    russian: "Pусский",
    pусский: "Pусский",
    ru: "Pусский",
    portuguese: "Português",
    português: "Português",
    pt: "Português",
    italian: "Italiana",
    italiana: "Italiana",
    it: "Italiana",
    international: "Ø",
    chinese: "中文",
    中文: "中文",
    zh: "中文",
    cn: "中文"
}

export default new Command({
    name: "language",
    aliases: ["lang"],
    description: "Give a member a language role.",
    permission: Roles.STAFF,
    usage: "<member> <language>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to give a language role to!"
                    : "Couldn't find that user."
            )

        const member: GuildMember = await client.guilds.main.members
            .fetch({ user, cache: true })
            .catch(noop)
        if (!member) return message.channel.sendError("The user is not in the server!")

        const languageInput = args.consume().toLowerCase()
        const language = LANGUAGE_ROLES[languageInput]
        if (!language)
            return message.channel.sendError(
                languageInput ? "That's not a language!" : "You must provide a language!"
            )

        const role = client.guilds.main.role(language)
        await member.roles.add(role)
        await message.channel.sendSuccess("Role added!")
    }
})
