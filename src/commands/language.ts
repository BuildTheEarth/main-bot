import Client from "../struct/Client"
import Discord from "discord.js"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Guild from "../struct/discord/Guild"
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
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return client.channel.sendError(
                message.channel,
                user === undefined
                    ? "You must provide a user to give a language role to!"
                    : "Couldn't find that user."
            )

        const member: Discord.GuildMember = await client.customGuilds
            .main()
            .members.fetch({ user, cache: true })
            .catch(noop)
        if (!member)
            return client.channel.sendError(
                message.channel,
                "The user is not in the server!"
            )

        const languageInput = args.consume().toLowerCase()
        const language = LANGUAGE_ROLES[languageInput]
        if (!language)
            return client.channel.sendError(
                message.channel,
                languageInput ? "That's not a language!" : "You must provide a language!"
            )

        const role = Guild.role(client.customGuilds.main(), language)
        await member.roles.add(role)
        await client.channel.sendSuccess(message.channel, "Role added!")
    }
})
