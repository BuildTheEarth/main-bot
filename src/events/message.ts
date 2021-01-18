import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Role from "../struct/discord/Role"
import Snippet from "../entities/Snippet"
import languages from "../util/patchedISO6391"
import Roles from "../util/roles"
import chalk from "chalk"

export default async function (this: Client, message: Message): Promise<unknown> {
    if (message.guild?.id === this.config.guilds.youtube) return
    if (message.author.bot) return

    const mainGuild = this.guilds.cache.get(this.config.guilds.main)
    const main = mainGuild.id === message.guild?.id
    if (main && message.type === "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3") {
        await message.guild.setVanityCode(this.config.vanity, "Reached level 3 boosting")
        this.logger.info(`Set vanity code to ${chalk.hex("#FF73FA")(this.config.vanity)}`)
        return
    }

    if (message.content.startsWith(this.config.prefix)) {
        const body = message.content.slice(this.config.prefix.length).trim()
        const args = new Args(body, message)
        const commandName = args.consume()

        const command = this.commands.search(commandName)
        if (!command) {
            const firstArg = args.consume().toLowerCase()
            const languageName = languages.getName(firstArg) || "English"
            const language = languages.validate(firstArg) ? firstArg.toLowerCase() : "en"
            const snippet = await Snippet.findOne({ name: commandName, language })

            if (firstArg.toLowerCase() === "zh")
                return message.channel.sendError(
                    `Please choose \`zh-s\` (简体中文) or \`zh-t\` (繁體中文)!`
                )

            if (!snippet) {
                const unlocalizedSnippet = await Snippet.findOne({ name: commandName })
                if (unlocalizedSnippet)
                    message.channel.sendError(
                        `The **${commandName}** snippet hasn't been translated to ${languageName} yet.`
                    )
                return
            }

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return message.channel.send(snippet.body).catch(() => {})
        }

        const member = (message.guild
            ? message.member
            : await mainGuild.members
                  .fetch({ user: message.author, cache: true })
                  .catch(() => null)) as GuildMember

        const hasPermission = member && member.hasStaffPermission(command.permission)
        if (!member && !command.dms) return
        if (command.permission !== Roles.ANY && !hasPermission) return

        command.run(this, message, args)
        const tag = member
            ? (<Role>member.roles.highest).format()
            : chalk.blueBright("DMs")
        this.logger.info(`${tag} ${message.author.tag} ran '${commandName}' command.`)
        return
    }

    const suggestions = Object.values(this.config.suggestions)
    if (
        suggestions.includes(message.channel.id) &&
        !message.member.hasStaffPermission(Roles.MANAGER)
    ) {
        const error = await message.channel.sendError(
            `Please use the \`suggest\` command to post suggestions! (Check \`${this.config.prefix}help suggest\` for help). **Your message will be deleted in 30 seconds.**`
        )

        await message.delete({ timeout: 30000 })
        await error.delete({ timeout: 30000 })
        return
    }

    if (message.content === "donde es server")
        return message.channel.send("hay un server!")
}
