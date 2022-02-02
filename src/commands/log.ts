import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"

//THIS IS HELLA FUCKING JANK

export default new Command({
    name: "log",
    aliases: [],
    description: "View information about a role.",
    permission: Roles.MANAGER,
    async run(this: Command, client: Client, message: CommandMessage) {
        const date = new Date()
        message.send({ files: [`./logs/${date.toISOString().split('T')[0]}.log`] });
    }
})
