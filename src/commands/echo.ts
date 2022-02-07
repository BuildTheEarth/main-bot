import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"
import Args from "../struct/Args"

//THIS IS HELLA {No swears in the codebase} JANK

export default new Command({
    name: "echo",
    aliases: [],
    description: "Why are you using this.",
    permission: Roles.MANAGER,
    devOnly: true,
    args: [
        {
            name: "echo",
            description: "text to echo",
            optionType: "STRING",
            required: true
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        await message.send({
            content: client.placeholder.replacePlaceholders(args.consumeRest(["echo"]))
        })
    }
})
