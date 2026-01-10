import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import ApiTypes = require("discord-api-types/v10")
import CommandMessage from "../struct/CommandMessage.js"
import { hexToNum } from "@buildtheearth/bot-utils"
import { TextChannel } from "discord.js"

export default new Command({
    name: "unlock",
    aliases: [],
    description: "Unlock the channel.",
    permission: globalThis.client.roles.MANAGER,
    args: [
        {
            name: "channel",
            description: "The channel to unlock",
            required: false,
            optionType: "CHANNEL",
            channelTypes: [ApiTypes.ChannelType.GuildText]
        }
    ],
    async run(this: Command, client: BotClient, message: CommandMessage, args: Args) {
        const channel =
            (await args.consumeChannel("channel")) || (message.channel as TextChannel)
        /*eslint-disable */
        const reason = `By ${message.member.user.tag} (${message.member.id})`
        /*eslint-enable */
        await (channel as TextChannel).permissionOverwrites.edit(message.guild.id, {
            SendMessages: null
        }) // There is no non-hacky reason support here now

        await message.sendSuccessMessage("unlockedChannel", channel)
        await client.log({
            color: hexToNum(client.config.colors.success),
            author: { name: "Unlocked" },
            description: `Channel ${channel} unlocked by ${message.member}.`
        })
    }
})
