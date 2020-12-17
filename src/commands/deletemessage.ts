import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import TextChannel from "../struct/discord/TextChannel"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import noop from "../util/noop"
import Discord from "discord.js"

export default new Command({
    name: "deletemessage",
    aliases: ["delmsg", "removemessage", "removemsg"],
    description: "Deletes a message",
    permission: Roles.MANAGER,
    usage: "<channelID> <messageID>",
    async run(this: Command, client: Client, message: Message, args: Args) {
      const channel = await args.consumeChannel()
      const messageID = await args.consumeRest().split(" ", 2)[1];
      let messageToDel
      let error: string
      try {

      messageToDel = await channel.messages.fetch(messageID)
      }
      catch(oof) {
      error = "Well thats one invalid message ID"
      }

      if (isNaN(Number(messageToDel))) error = "Invalid Message ID"
      if (!channel) error = "Invalid Channel"


      if (error) {
        const errorMessage = await message.channel.sendError(error)
        message.react("❎")
        return await errorMessage.delete({ timeout: 10000 })

     }else{
       await messageToDel.delete()
       message.react("✅")

     }



    }
})
