import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "team",
    aliases: ["buildteam", "bt", "invite"],
    description: "Get an invite for a build team.",
    permission: Roles.ANY,
    usage: "<team>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const input = args.consume().toLowerCase()
        const team = Object.keys(client.config.buildTeamInvites).find(team => {
            team = team.toLowerCase()
            return team === input || (input.length > 3 && team.includes(input))
        })

        if (!team)
            return message.channel.sendError("Couldn't find an invite for that team.")
        const invite = client.config.buildTeamInvites[team]
        message.channel.send(invite)
    }
})
