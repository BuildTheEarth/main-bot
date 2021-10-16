import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Guild from "../struct/discord/Guild"
import Args from "../struct/Args"
import Role from "../struct/discord/Role"
import Snippet from "../entities/Snippet"
import languages from "../util/patchedISO6391"
import Roles from "../util/roles"
import chalk from "chalk"
import Discord from "discord.js"
import { Brackets, WhereExpressionBuilder } from "typeorm"

export default async function (this: Client, message: Discord.Message): Promise<unknown> {
    if (message.author.bot) return
    const Snippets = Snippet.getRepository()

    const mainGuild = this.customGuilds.main()
    const main = mainGuild.id === message.guild?.id
    if (main && message.type === "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3") {
        await Guild.setVanityCode(
            message.guild,
            this.config.vanity,
            "Reached level 3 boosting"
        )
        this.logger.info(`Set vanity code to ${chalk.hex("#FF73FA")(this.config.vanity)}`)
        return
    }

    if (message.content.startsWith(this.config.prefix)) {
        const body = message.content.slice(this.config.prefix.length).trim()
        const args = new Args(body, message)

        const command = this.commands.search(args.command)
        if (!command) {
            const firstArg = args.consume().toLowerCase()
            const languageName = languages.getName(firstArg) || "English"
            const language = languages.validate(firstArg) ? firstArg.toLowerCase() : "en"

            if (firstArg.toLowerCase() === "zh")
                return this.channel.sendError(
                    message.channel,
                    `Please choose \`zh-s\` (简体中文) or \`zh-t\` (繁體中文)!`
                )

            const find = (query: WhereExpressionBuilder) =>
                query
                    .where("snippet.name = :name", { name: args.command })
                    .andWhere("snippet.type = 'snippet'")
                    .orWhere(
                        new Brackets(qb => {
                            qb.where(
                                "INSTR(snippet.aliases, CONCAT(:name, ','))"
                            ).andWhere("snippet.type = 'snippet'")
                        })
                    )
                    .orWhere(
                        new Brackets(qb => {
                            qb.where(
                                "INSTR(snippet.aliases, CONCAT(',', :name))"
                            ).andWhere("snippet.type = 'snippet'")
                        })
                    )

            const snippet = await Snippets.createQueryBuilder("snippet")
                .where("snippet.language = :language", { language })
                .andWhere(new Brackets(find))
                .andWhere("snippet.type = 'snippet'")
                .getOne()

            if (!snippet) {
                const unlocalizedSnippet = await Snippets.createQueryBuilder("snippet")
                    .where(new Brackets(find))
                    .andWhere("snippet.type = 'snippet'")
                    .getOne()
                if (unlocalizedSnippet)
                    this.channel.sendError(
                        message.channel,
                        `The **${args.command}** snippet hasn't been translated to ${languageName} yet.`
                    )
                return
            }

            return message.channel.send(snippet.body).catch(() => null)
        }

        const member = (
            message.guild
                ? message.member
                : await mainGuild.members
                      .fetch({ user: message.author, cache: true })
                      .catch(() => null)
        ) as Discord.GuildMember

        const hasPermission = member && GuildMember.hasRole(member, command.permission)
        if (message.channel.type === "DM" && !command.dms) return
        if (command.permission !== Roles.ANY && !hasPermission) return

        const label = message.member
            ? Role.format(member.roles.highest as Discord.Role)
            : chalk.blueBright("DMs")
        const tag =
            command.name === "suggest" && !message.guild
                ? "(Anonymous)"
                : message.author.tag

        try {
            await command.run(this, message, args)
        } catch (error) {
            this.channel.sendError(
                message.channel,
                "An unknown error occurred! Please contact one of the bot developers for help."
            )

            const stack = (error.stack as string)
                .split("\n")
                .map(line => "    " + line)
                .join("\n")
            return this.logger.error(
                `${label} ${tag} tried to run '${command.name}' command:\n${stack}`
            )
        }

        return this.logger.info(`${label} ${tag} ran '${command.name}' command.`)
    }

    const suggestions = Object.values(this.config.suggestions)
    if (
        suggestions.includes(message.channel.id) &&
        !GuildMember.hasRole(message.member, Roles.MANAGER)
    ) {
        const error = await this.channel.sendError(
            message.channel,
            `Please use the \`suggest\` command to post suggestions! (Check \`${this.config.prefix}help suggest\` for help). **Your message will be deleted in 30 seconds.**`
        )

        setTimeout(() => message.delete(), 30000)
        setTimeout(() => error.delete(), 30000)
        return
    }

    if (message.content === "donde es server")
        return message.channel.send("hay un server!")
}
