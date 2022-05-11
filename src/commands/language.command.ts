import Client from "../struct/Client.js"
import Discord from "discord.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Guild from "../struct/discord/Guild.js"

import { noop } from "@buildtheearth/bot-utils"
import CommandMessage from "../struct/CommandMessage.js"

const ROLE_NAMES = [
    "English",
    "Español",
    "Français",
    "Deutsch",
    "Pусский",
    "Português",
    "Italiana",
    "Ø",
    "中文"
]
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
    permission: globalThis.client.roles.STAFF,
    args: [
        {
            name: "member",
            description: "Member to give role.",
            required: true,
            optionType: "USER"
        },
        {
            name: "language",
            description: "Language to give.",
            required: true,
            optionType: "STRING",
            choices: ROLE_NAMES //NOTE: To stay under the 25 entry limit and not offend any one language in specific, since it is choices we simply just have the role names only, the normal command will support them all, feel free to suggest a better solution
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")

        const member: Discord.GuildMember = await (
            await client.customGuilds.main()
        ).members
            .fetch({ user, cache: true })
            .catch(noop)
        if (!member) return message.sendErrorMessage("notInGuild")

        const languageInput = args.consume("language").toLowerCase()
        const language: string = LANGUAGE_ROLES[languageInput]
        if (!language)
            return message.sendErrorMessage(languageInput ? "notLang" : "noLang")

        await message.continue()

        const role = Guild.roleByName(client.customGuilds.main(), language)
        await member.roles.add(role)
        await message.sendSuccessMessage("roleAdded")
    }
})
