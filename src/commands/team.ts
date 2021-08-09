import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import Discord from "discord.js"

export default new Command({
    name: "team",
    aliases: ["buildteam", "bt", "invite"],
    description: "Get an invite for a build team.",
    permission: Roles.ANY,
    usage: "<team>",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const input = args.consumeRest().toLowerCase()
        const teams = Object.keys(client.config.buildTeamInvites)
        const team = // using separate calls to give priority to the first criterion
            teams.find(team => team === input) || teams.find(team => team.includes(input))

        if (!team)
            return client.channel.sendError(
                message.channel,
                "Couldn't find an invite for that team."
            )
        const invite = client.config.buildTeamInvites[team]
        message.channel.send(invite)
    }
})
