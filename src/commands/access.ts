import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "access",
    aliases: [],
    description: "Enable the Manage Permissions permission for a channel.",
    permission: Roles.MANAGER,
    usage: "[channel]",
    async run(this: Command, _client: Client, message: Message, args: Args) {
        const channel = await args.consumeChannel()
        const perms = channel.permissionsFor(message.member)
        if (!perms.has("VIEW_CHANNEL"))
            return message.channel.sendError("You can't see that channel.")

        const manager = message.guild.role(Roles.MANAGER)
        const reason = `Access requested by ${message.author.tag} (${message.author.id})`
        await channel.updateOverwrite(manager, { MANAGE_ROLES: true }, reason)

        await message.channel.sendSuccess(`Gave managers permission in ${channel}.`)
    }
})
