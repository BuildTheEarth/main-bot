import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "catte",
    aliases: ["catte_", "noah", "arc"],
    description: "cAtte_ is the best",
    permission: Roles.ANY,
    usage: "",
    async run(this: Command, _client: Client, message: Message) {
        await message.channel.send("Is the best staff")
    }
})
