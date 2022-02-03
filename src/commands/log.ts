import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"

//THIS IS HELLA {No swears in the codebase} JANK

export default new Command({
    name: "log",
    aliases: [],
    description: "Why are you using this.",
    permission: Roles.MANAGER,
    devOnly: true,
    async run(this: Command, client: Client, message: CommandMessage) {
        const date = new Date()
        message.send({ files: [`./logs/${date.toISOString().split("T")[0]}.log`] })
    }
})
