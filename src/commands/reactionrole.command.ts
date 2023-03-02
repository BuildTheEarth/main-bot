import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"
import emojiTree from 'emoji-tree'

export default new Command({
    name: "reactionroles",
    aliases: ["rr"],
    description: "Manage reaction roles",
    permission: [globalThis.client.roles.MANAGER, globalThis.client.roles.BOT_DEVELOPER],
    subcommands: [
        {
            name: "list",
            description: "List reaction roles",
            args: []
        },
        {
            name: "add",
            description: "Add a reaction role",
            args: [
                {
                    name: "emoji",
                    description: "The emoji for the reaction role",
                    optionType: "STRING",
                    required: true
                },
                {
                    name: "message_link",
                    description: "The message link for the reaction role",
                    optionType: "STRING",
                    required: true
                },
                {
                    name: "role",
                    description: "The role received in the reaction",
                    optionType: "ROLE",
                    required: true
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a reaction role",
            args: [
                {
                    name: "emoji",
                    description: "The emoji for the reaction role",
                    optionType: "STRING",
                    required: true
                },
                {
                    name: "message_link",
                    description: "The message link for the reaction role",
                    optionType: "STRING",
                    required: true
                }
            ]
        },
        {
            name: "blacklist",
            description: "Blacklist roles from a reaction roles",
            group: true,
            subcommands: [
                {
                    name: "add",
                    description: "Add a blacklisted role",
                    args: [
                        {
                            name: "emoji",
                            description: "The emoji for the reaction role",
                            optionType: "STRING",
                            required: true
                        },
                        {
                            name: "message_link",
                            description: "The message link for the reaction role",
                            optionType: "STRING",
                            required: true
                        },
                        {
                            name: "blacklist_role",
                            description: "The role to blacklist",
                            optionType: "ROLE",
                            required: true
                        }
                    ]
                },
                {
                    name: "delete",
                    description: "Delete a blacklisted role",
                    args: [
                        {
                            name: "emoji",
                            description: "The emoji for the reaction role",
                            optionType: "STRING",
                            required: true
                        },
                        {
                            name: "message_link",
                            description: "The message link for the reaction role",
                            optionType: "STRING",
                            required: true
                        },
                        {
                            name: "blacklist_role",
                            description: "The role to remove from blacklist",
                            optionType: "ROLE",
                            required: true
                        }
                    ]
                }
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
                    args: [
                        {
                            name: "require_role",
                            description: "The role to require",
                            optionType: "ROLE",
                            required: true
                        }
                    ]
                },
                {
                    name: "delete",
                    description: "Delete a required role",
                    args: [            
                        {
                            name: "emoji",
                            description: "The emoji for the reaction role",
                            optionType: "STRING",
                            required: true
                        },
                        {
                            name: "message_link",
                            description: "The message link for the reaction role",
                            optionType: "STRING",
                            required: true
                        },
                        {
                            name: "require_role",
                            description: "The role to remove",
                            optionType: "ROLE",
                            required: true
                        }
                    ]
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommandGroup = args.consumeSubcommandGroupIf(['blacklist', 'require'])
        if (subcommandGroup == null) {
            const subcommand = args.consumeSubcommand()
            if (subcommand == "list") {
                return message.sendError("no")
            } else {
                const emoji = args.consume("emoji")
                const messageLink = args.consume("message_link")
                let realEmoji : string | undefined = undefined
                const emojis = emojiTree(emoji).filter((ele) => ele.type == "emoji").map((ele) => ele.text)
                console.log(emojis)
                if (emojis.length >= 1) {
                    realEmoji = emojis[0]
                } else {
                    const matches = emoji.match(/<a?:.+?:\d{16,20}>/gu)
                    if (matches && matches.length >= 1) {
                        realEmoji =  matches[0].match(/(\d+)/)?.[0]
                    }
                }
                if (!realEmoji) {
                    return message.sendErrorMessage("emojiNotFound")
                }
                console.log(realEmoji)
                return message.sendSuccess(realEmoji)
            }
        }
    }
})
