import Discord from "discord.js"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Role from "../struct/discord/Role"
import Snippet from "../entities/Snippet"

export default async function (this: Client, message: Discord.Message) {
    if (message.author.bot) return
    if (!message.content.startsWith(this.config.prefix)) return

    const body = message.content.slice(this.config.prefix.length).trim()
    const args = body.split(" ").slice(1).join(" ").trim()
    const commandName = body.split(" ")[0].toLowerCase()

    const command = this.commands.search(commandName)
    if (!command) {
        const firstArg = (args.split(" ")[0] || "").trim().toLowerCase()
        const language = firstArg.length === 2 ? firstArg : "en"

        const snippet = await Snippet.findOne({
            where: { name: commandName, language: language }
        })

        if (!snippet) {
            const unlocalizedSnippet = await Snippet.findOne({
                where: { name: commandName }
            })

            if (unlocalizedSnippet) {
                message.channel.send({
                    embed: {
                        color: this.config.colors.error,
                        description: `The **${commandName}** snippet hasn't been translated to \`${language}\` yet.`
                    }
                })
            }

            return
        }

        return message.channel.send(snippet.body).catch(() => {})
    }

    const member = <GuildMember>message.member
    if (!member.hasStaffPermission(command.permission)) return
    command.run(this, message, args)

    const highestRole = <Role>member.roles.highest
    this.logger.info(
        `${highestRole.format()} ${member.user.tag} ran '${commandName}' command.`
    )
}
