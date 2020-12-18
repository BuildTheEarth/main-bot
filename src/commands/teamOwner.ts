import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "teamowner",
    aliases: ["bto", "to"],
    description: "Make a member Team Owner.",
    permission: Roles.REGIONAL_BUILD_TEAM_LEAD,
    usage: "<member> ['demote']",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to make Team Owner!"
                    : "Couldn't find that user."
            )
        const member = await message.guild.members
            .fetch({ user, cache: true })
            .catch(() => null)
        if (!member) return message.channel.sendError("The user is not in the server!")

        const demote = !!args.consumeIf("demote")
        const method = demote ? "remove" : "add"
        const past = demote ? "Demoted" : "Promoted"
        const preposition = demote ? "from" : "to"
        const role = message.guild.roles.cache.find(r => r.name === Roles.TEAM_OWNER)
        await member.roles[method](role)
        await message.channel.sendSuccess(
            `${past} <@${user.id}> ${preposition} Team Owner!`
        )
    }
})
