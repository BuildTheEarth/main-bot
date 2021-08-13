import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Guild from "../struct/discord/Guild"
import Roles from "../util/roles"
import Discord from "discord.js"

export default new Command({
    name: "access",
    aliases: [],
    description: "Enable the Manage Permissions permission for a channel.",
    permission: Roles.MANAGER,
    usage: "[channel]",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const channel = await args.consumeChannel()
        const perms = channel.permissionsFor(message.member)
        if (!perms.has("VIEW_CHANNEL"))
            return client.channel.sendError(
                message.channel,
                "You can't see that channel."
            )

        const manager = Guild.role(message.guild, Roles.MANAGER)
        /*eslint-disable */
        const reason = `Access requested by ${message.author.tag} (${message.author.id})`
        /*eslint-enable */
        await channel.permissionOverwrites.edit(manager, { MANAGE_ROLES: true }) // There is no non-hacky reason support here now

        await client.channel.sendSuccess(
            message.channel,
            `Gave managers permission in ${channel}.`
        )
    }
})
