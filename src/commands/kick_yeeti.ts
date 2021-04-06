import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import ActionLog from "../entities/ActionLog"
import Roles from "../util/roles"
// I am begging you to add this - Jesus 
export default new Command({
    name: "yeeti",
    aliases: [],              // I don't know how you could refuse to add this 
    description: "Kick a member but 😩Yeeti😎 style 😂👌🔥",
    permission: [Roles.MODERATOR, Roles.MANAGER],
    usage: "<member> [image URL | attachment] <username, pfp, status>",  
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to yeet!!"
                    : "Couldn't find that user."
            )

        const image = args.consumeImage()
        const reason = "Please change your " + args.consumeRest() + " and then you can come back."
        if (!args.consumeRest()) return message.channel.sendError("You must provide a reason!🙄🙄")

        const member: GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(() => null)
        if (!member) return message.channel.sendError("The user is not in the server!🤣")
        if (member.hasRole(Roles.STAFF))
            return message.channel.sendError(
                member.id === message.author.id
                    ? "Okay, sadist, you can't yeet yourself."
                    : "Rude! You can't yeet other staff."
            )

        const log = new ActionLog()
        log.action = "kick"
        log.member = user.id
        log.executor = message.author.id
        log.reason = reason
        log.reasonImage = image
        log.channel = message.channel.id
        log.message = message.id
        log.length = null
        await log.save()

        await log.notifyMember(client)
        await member.kick(reason)
        await message.channel.sendSuccess(`💯Yeeted💯 ${user} (**#${log.id}**).`)
        await client.log(log)
    }
})