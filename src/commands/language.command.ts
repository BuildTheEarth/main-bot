import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import BotGuild from "../struct/discord/BotGuild.js"

import { noop } from "@buildtheearth/bot-utils"
import CommandMessage from "../struct/CommandMessage.js"
import { GuildMember } from "discord.js"

const ROLE_NAMES = [
    "English",
    "Español",
    "Français",
    "Deutsch",
    "Pусский",
    "Português",
    "Italiano",
    "Ø",
    "中文"
]
//strictly speaking we dont need this anymore but hey if we do ever need it the future, abstraction is better than not
const LANGUAGE_ROLES: Record<string, string> = {
    English: "English",
    Español: "Español",
    Français: "Français",
    Deutsch: "Deutsch",
    Pусский: "Pусский",
    Português: "Português",
    Italiano: "Italiana",
    Ø: "Ø",
    中文: "中文"
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
    async run(this: Command, client: BotClient, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")

        const member: GuildMember | null = await (
            await client.customGuilds.main()
        ).members
            .fetch({ user, cache: true })
            .catch(noop)
        if (!member) return message.sendErrorMessage("notInGuild")

        const languageInput = args.consume("language")
        const language: string = LANGUAGE_ROLES[languageInput]
        if (!language)
            return message.sendErrorMessage(languageInput ? "notLang" : "noLang")

        await message.continue()

        const role = BotGuild.roleByName(client.customGuilds.main(), language)
        await member.roles.add(role)
        await message.sendSuccessMessage("roleAdded")
    }
})
