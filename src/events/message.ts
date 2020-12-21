import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Role from "../struct/discord/Role"
import Snippet from "../entities/Snippet"
import languages from "iso-639-1"
import Roles from "../util/roles"
import chalk from "chalk"

export default async function (this: Client, message: Message): Promise<unknown> {
    if (message.author.bot) return

    const main = message.guild?.id === this.config.guilds.main
    if (main && message.type === "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3") {
        await message.guild.setVanityCode(this.config.vanity)
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
            const languageName = languages.getName(firstArg)
            const language = languageName ? firstArg.toLowerCase() : "en"
            const snippet = await Snippet.findOne({ name: commandName, language })

            if (!snippet) {
                const unlocalizedSnippet = await Snippet.findOne({ name: commandName })
                if (unlocalizedSnippet)
                    // prettier-ignore
                    message.channel.sendError(`The **${commandName}** snippet hasn't been translated to ${languageName || "English"} yet.`)
                return
            }

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return message.channel.send(snippet.body).catch(() => {})
        }

        const member = message.member as GuildMember
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
    if (suggestions.includes(message.channel.id)) {
        const error = await message.channel.sendError(
            `Please use the \`suggest\` command to post suggestions! (Check \`${this.config.prefix}help suggest\` for help). **Your message will be deleted in 30 seconds.**`
        )

        await message.delete({ timeout: 30000 })
        await error.delete({ timeout: 30000 })
        return
    }

    if (message.content === "donde es server")
        return message.channel.send("no hay server!")
}
