import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import hexToRGB from "../util/hexToRGB"
import Discord from "discord.js"

export default new Command({
    name: "unlock",
    aliases: [],
    description: "Unlock the channel.",
    permission: Roles.MANAGER,
    usage: "[channel]",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const channel =
            (await args.consumeChannel()) || (message.channel as Discord.TextChannel)
        /*eslint-disable */
        const reason = `By ${message.author.tag} (${message.author.id})`
        /*eslint-enable */
        await channel.permissionOverwrites.edit(message.guild.id, { SEND_MESSAGES: null }) // There is no non-hacky reason support here now

        await client.channel.sendSuccess(message.channel, `Unlocked ${channel}.`)
        await client.log({
            color: hexToRGB(client.config.colors.success),
            author: { name: "Unlocked" },
            description: `Channel ${channel} unlocked by ${message.author}.`
        })
    }
})
