import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Message from "../struct/discord/Message"
import Role from "../struct/discord/Role"
import Snippet from "../entities/Snippet"
import languages from "iso-639-1"

export default async function (this: Client, message: Message) {
    if (message.author.bot) return
    if (!message.content.startsWith(this.config.prefix)) return

    const body = message.content.slice(this.config.prefix.length).trim()
    const args = body.split(" ").slice(1).join(" ").trim()
    const commandName = body.split(" ")[0].toLowerCase()

    const command = this.commands.search(commandName)
    if (!command) {
        const firstArg = (args.split(" ")[0] || "").trim().toLowerCase()
        const languageName = languages.getName(firstArg)
        const language = languageName ? firstArg.toLowerCase() : "en"

        const snippet = await Snippet.findOne({
            where: { name: commandName, language: language }
        })

        if (!snippet) {
            const unlocalizedSnippet = await Snippet.findOne({
                where: { name: commandName }
            })
            if (unlocalizedSnippet)
                message.channel.sendError(
                    `The **${commandName}** snippet hasn't been translated to ${languageName} yet.`
                )
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
