import Discord from "discord.js"
import Client from "../struct/Client"
import Command from "../struct/Command"
import roles from "../util/roles"

export default new Command({
    name: "ping",
    aliases: [],
    description: "Ping pong!",
    permission: roles.ANY,
    usage: "",
    async run(_client: Client, message: Discord.Message) {
        message.channel.send(":ping_pong: Pong!")
    }
})
