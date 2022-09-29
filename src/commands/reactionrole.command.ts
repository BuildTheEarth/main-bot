import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"

export default new Command({
    name: "reactionroles",
    aliases: ["rr"],
    description: "Manage reaction roles",
    permission: [globalThis.client.roles.MANAGER, globalThis.client.roles.BOT_DEVELOPER],
    subcommands: [
        {
            name: "add",
            description: "Add a reaction role",
            args: []
        },
        {
            name: "delete",
            description: "Delete a reaction role",
            args: []
        },
        {
            name: "blacklist",
            description: "Blacklist roles from a reaction roles",
            group: true,
            subcommands: [
                {
                    name: "add",
                    description: "Add a blacklisted role",
                    args: []
                },
                {
                    name: "delete",
                    description: "Delete a blacklisted role",
                    args: []
                },
            ]
        },
        {
            name: "require",
            description: "Require roles for a reaction roles",
            group: true,
            subcommands: [
                {
                    name: "add",
                    description: "Add a required role",
                    args: []
                },
                {
                    name: "delete",
                    description: "Delete a required role",
                    args: []
                },
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        message.sendError("Will be added soon!")
    }
})
