import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import noop from "../util/noop"
import Guild from "../struct/discord/Guild" 

export default new Command({
    name: "language",
    aliases: ["lang"],
    description: "Give a member a language role.",
    permission: Roles.SUPPORT, Roles.HELPER
    usage: "<member> <lanuage>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()

        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to give language roles too!"
                    : "Couldn't find that user."
            )

        const language = args.consumeRest()
        let langmap = new Map([
        ["english", "ENGLISH"],
        ["espanol", "ESPAÑOL"],
        ["francais", "FRANÇAIS"],
        ["deutsch", "DEUTSCH"],
        ["russian", "PУССКИЙ"],
        ["portuguese", "PORTUGUÊS"],
        ["italian", "ITALIANA"],
        ["internatinal", "Ø"],
        ["chinese", "中文"]]);
        const member = message.guild.member(user)
        if (langmap.has(language.toLowerCase))
        {
        await member.addRole(langmap.get(language.toLowerCase))
        message.channel.sendSucess("Role Added!")
        }
        if (!language) return message.channel.sendError(
          !langmap.has(language.toLowerCase)
              ? "Invalid language!"
              : "You must provide a language!"
        )
        

        



    }
})
