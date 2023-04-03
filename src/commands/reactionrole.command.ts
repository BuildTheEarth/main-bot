import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"
import emojiTree from "emoji-tree"
import getEmoji from "../util/getEmoji.util.js"
import { noop } from "@buildtheearth/bot-utils"

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
        const subcommandGroup = args.consumeSubcommandGroupIf(["blacklist", "require"])
        if (subcommandGroup == null) {
            const subcommand = args.consumeSubcommand()
            if (subcommand == "list") {
                return message.sendError("no")
            } else {
                const emoji = args.consume("emoji")
                const realEmoji = getEmoji(emoji)
                if (!realEmoji) {
                    return message.sendErrorMessage("emojiNotFound")
                }
                console.log(realEmoji)
                

                const urlRegex =
                /(?<=(https:\/\/)(canary\.discord\.com\/channels\/|discord\.com\/channels\/|ptb\.discord\.com\/channels\/))([0-9]{17,})(\/)([0-9]{17,})(\/)([0-9]{17,})/
                const messageUrl = args.consume("message_link")
                if (!messageUrl) return message.sendErrorMessage("provideMsgUrl")
                if (!urlRegex.test(messageUrl)) return message.sendErrorMessage("provideMsgUrl")
                const messagePropsTemp = urlRegex.exec(messageUrl)
                if (!messagePropsTemp) return message.sendErrorMessage("provideMsgUrl")
                const messageProps = {
                    guildId: messagePropsTemp[3],
                    channelId: messagePropsTemp[5],
                    messageId: messagePropsTemp[7]
                }
        
                const guild = await client.guilds.fetch(messageProps.guildId).catch(noop)
        
                if (!guild) {
                    return message.sendErrorMessage("provideMsgUrl")
                }
        
                const channel = await guild.channels.fetch(messageProps.channelId).catch(noop)
        
                if (!channel) return message.sendErrorMessage("provideMsgUrl")

                if (!channel.isTextBased()) return message.sendErrorMessage("provideMsgUrl")

                const reactMsg = await channel.messages.fetch(messageProps.messageId).catch(noop)

                if (!reactMsg) return message.sendErrorMessage("provideMsgUrl")

                

                return message.sendSuccess(realEmoji)
            }
        }
    }
})
