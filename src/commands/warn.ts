import Client from "../struct/Client"
import Guild from "../struct/discord/Guild"
import Message from "../struct/discord/Message"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import Roles from "../util/roles"
import noop from "../util/noop"

export default new Command({
    name: "warn",
    aliases: [],
    description: "Warn a member.",
    permission: [Roles.HELPER, Roles.MODERATOR],
    usage: "<member> <reason>",
    async run(this: Command, client: Client, message: Message, args: string) {
        const result = await (<Guild>message.guild).members.find(args)
        args = result.args
        const target = result.member

        if (!target) {
            return message.channel.send({
                embed: {
                    color: client.config.colors.error,
                    description:
                        target === undefined
                            ? `Couldn't find user \`${result.input}\`.`
                            : `You must provide a user to warn!`
                }
            })
        }

        const reason = args.trim()
        if (!reason) {
            return message.channel.send({
                embed: {
                    color: client.config.colors.error,
                    description: "You must provide a reason!"
                }
            })
        }

        message.channel.send({
            embed: {
                color: client.config.colors.success,
                description: `Warned ${target.user} • *${reason}*`
            }
        })

        // prettier-ignore
        target.user.send({
            embed: {
                color: client.config.colors.error,
                description: `${message.author} has warned you:\n\n*${reason}*`
            }
        }).catch(noop)

        const log = new ActionLog()
        log.action = "warn"
        log.member = target.id
        log.executor = message.author.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id

        log.save()
    }
})
