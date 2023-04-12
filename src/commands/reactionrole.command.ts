import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"
import emojiTree from "emoji-tree"
import getEmoji from "../util/getEmoji.util.js"
import { hexToNum, noop } from "@buildtheearth/bot-utils"
import ReactionRole from "../entities/ReactionRole.entity.js"
import { cli } from "winston/lib/winston/config/index.js"

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
                },
                {
                    name: "require_type",
                    description: "The require type",
                    optionType: "BOOLEAN",
                    required: false
                },
                {
                    name: "blacklist_type",
                    description: "The blacklist type",
                    optionType: "BOOLEAN",
                    required: false
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
                },
                {
                    name: "list",
                    description: "Lists blacklisted roles",
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
                },
                {
                    name: "list",
                    description: "Lists required roles",
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
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommandGroup = args.consumeSubcommandGroupIf(["blacklist", "require"])
        const subcommand = args.consumeSubcommand()
        if (subcommand == "list" && !subcommandGroup) {
            const embedStr = [""]
            let currIdx = 0
            const roles = await ReactionRole.find()
            for (const e of roles) {
                const channel = await client.channels.fetch(e.channelId).catch(noop)
                if (!channel) continue
                if (channel.isDMBased()) continue
                const url = `https://discord.com/channels/${channel.guildId}/${e.channelId}/${e.messageId}`

                if (embedStr[currIdx].length > 4000) {
                    embedStr.push("")
                    currIdx++
                }

                let realEmoji = e.emoji

                if (realEmoji.match(/[0-9]{17,}/)) {
                    const tempmoji = client.emojis.cache.get(realEmoji)
                    if (tempmoji) realEmoji = `<:${tempmoji.identifier}>`
                }

                embedStr[
                    currIdx
                ] += `• [#${e.id} - ${realEmoji} in <#${e.channelId}>](${url})\n`
            }

            const embeds = []
            let first = true

            for (const embed of embedStr) {
                if (first) {
                    embeds.push({
                        name: "Reaction Roles",
                        description: embed,
                        color: hexToNum(client.config.colors.success)
                    })
                    first = false
                } else {
                    embeds.push({
                        description: embed,
                        color: hexToNum(client.config.colors.success)
                    })
                }
            }

            return message.send({ embeds: embeds })
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
            if (!urlRegex.test(messageUrl))
                return message.sendErrorMessage("provideMsgUrl")
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

            const reactMsg = await channel.messages
                .fetch(messageProps.messageId)
                .catch(noop)

            if (!reactMsg) return message.sendErrorMessage("provideMsgUrl")

            if (!subcommandGroup) {
                if (subcommand == "add") {
                    const role = await args.consumeRole("role")

                    const requireType = args.consumeBoolean("require_type")
                    const blacklistType = args.consumeBoolean("blacklist_type")

                    if (role.guild.id != messageProps.guildId)
                        return message.sendErrorMessage("provideMsgUrl")

                    const res = await ReactionRole.add(
                        client,
                        realEmoji,
                        messageProps.channelId,
                        messageProps.messageId,
                        role.id,
                        [],
                        [],
                        requireType,
                        blacklistType
                    )

                    if (!res) return message.sendErrorMessage("rrFail")
                    else {
                        let reactEmoji = realEmoji

                        if (reactEmoji.match(/[0-9]{17,}/)) {
                            const tempmoji = client.emojis.cache.get(reactEmoji)
                            if (tempmoji) reactEmoji = `<:${tempmoji.identifier}>`
                        }
                        reactMsg.react(reactEmoji)
                        return message.sendSuccessMessage("rrYes")
                    }
                } else if (subcommand == "delete") {
                    if (await ReactionRole.exists(realEmoji, messageProps.messageId)) {
                        const res = await ReactionRole.removeEmoji(
                            realEmoji,
                            messageProps.messageId
                        )
                        if (!res) return message.sendErrorMessage("rrFail")
                        return message.sendSuccessMessage("rrDel")
                    } else {
                        return message.sendErrorMessage("rrGone")
                    }
                }
            } else {
                if (!(await ReactionRole.exists(realEmoji, messageProps.messageId)))
                    return message.sendErrorMessage("rrGone")

                const rr = await ReactionRole.findOne({
                    emoji: realEmoji,
                    messageId: messageProps.messageId
                }).catch(noop)

                if (!rr) return message.sendErrorMessage("rrGone")

                if (subcommand == "list") {
                    const embedStr = [""]
                    let currIdx = 0
                    let roles

                    console.log(client.reactionRoles.keys())
                    
                    if (subcommandGroup == "blacklist") {
                        roles = client.reactionRoles.get(
                            `${realEmoji}.${messageProps.messageId}`
                        )?.blackListedRoles
                    } else {
                        roles = client.reactionRoles.get(
                            `${realEmoji}.${messageProps.messageId}`
                        )?.requiredRoles
                    }
                    if (!roles || roles.length === 0)
                        embedStr[currIdx] =
                            subcommandGroup == "blacklist"
                                ? "**No Blacklisted Roles**"
                                : "**No Whitelisted Roles**"
                    else {
                        for (const e of roles) {
                            if (embedStr[currIdx].length > 4000) {
                                embedStr.push("")
                                currIdx++
                            }
                            embedStr[currIdx] += `• <@&${e}>\n`
                        }
                    }

                    const embeds = []
                    let first = true

                    for (const embed of embedStr) {
                        if (first) {
                            embeds.push({
                                name:
                                    subcommandGroup == "blacklist"
                                        ? "Blacklisted Roles"
                                        : "Whitelisted Roles",
                                description: embed,
                                color: hexToNum(client.config.colors.success)
                            })
                            first = false
                        } else {
                            embeds.push({
                                description: embed,
                                color: hexToNum(client.config.colors.success)
                            })
                        }
                    }

                    return message.send({ embeds: embeds })
                }

                if (subcommandGroup == "blacklist") {
                    const blacklistRole = await args.consumeRole("blacklist_role")

                    if (blacklistRole.guild.id != messageProps.guildId)
                        return message.sendErrorMessage("provideMsgUrl")

                    if (subcommand == "add") {
                        const res = await ReactionRole.addBlacklistedRole(
                            client,
                            rr.id,
                            blacklistRole.id
                        )
                        if (res) return message.sendSuccessMessage("rrAddB")
                        else return message.sendErrorMessage("rrGone")
                    } else if (subcommand == "remove") {
                        const res = await ReactionRole.removeBlacklistedRole(
                            client,
                            rr.id,
                            blacklistRole.id
                        )
                        if (res) return message.sendSuccessMessage("rrRemB")
                        else return message.sendErrorMessage("rrNoExist")
                    }
                }

                if (subcommandGroup == "require") {
                    const requiredRole = await args.consumeRole("require_role")

                    if (requiredRole.guild.id != messageProps.guildId)
                        return message.sendErrorMessage("provideMsgUrl")

                    if (subcommand == "add") {
                        const res = await ReactionRole.addRequiredRole(
                            client,
                            rr.id,
                            requiredRole.id
                        )
                        if (res) return message.sendSuccessMessage("rrAddR")
                        else return message.sendErrorMessage("rrGone")
                    } else if (subcommand == "remove") {
                        const res = await ReactionRole.removeRequiredRole(
                            client,
                            rr.id,
                            requiredRole.id
                        )
                        if (res) return message.sendSuccessMessage("rrRemR")
                        else return message.sendErrorMessage("rrNoExist")
                    }
                }

                return message.sendSuccess(realEmoji)
            }
        }
    }
})
