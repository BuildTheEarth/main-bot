import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Discord from "discord.js"
import { humanizeConstant } from "@buildtheearth/bot-utils"

export default new Command({
    name: "role",
    aliases: ["roleinfo"],
    description: "View information about a role.",
    permission: globalThis.client.roles.ANY,
    basesubcommand: "view",
    args: [
        {
            name: "role",
            description: "The role to view.",
            required: true,
            optionType: "ROLE"
        }
    ],
    subcommands: [
        {
            name: "download",
            description: "Download a list of all the members in a role.",
            permission: [
                globalThis.client.roles.SUBTEAM_LEAD,
                globalThis.client.roles.MANAGER
            ],
            args: [
                {
                    name: "role",
                    description: "The role to download.",
                    required: true,
                    optionType: "ROLE"
                },
                {
                    name: "extended",
                    description: "Whether to include extended role information.",
                    required: false,
                    optionType: "STRING",
                    choices: ["extended"]
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(["view", "download"])
        const role = await args.consumeRole("role")
        if (!role) {
            return message.sendErrorMessage("noRole")
        }
        await message.continue()

        if (!subcommand || !["download"].includes(subcommand)) {
            const iconUrlTemp = role.iconURL()
            const roleMessage = await message.send({
                embeds: [
                    {
                        color: role.hexColor,
                        title: role.name,
                        thumbnail: {
                            url:  iconUrlTemp? iconUrlTemp: undefined
                        },
                        fields: [
                            {
                                name: "Members",
                                value:
                                    role.members.size.toString() +
                                    " (Fetching better results...)",
                                inline: true
                            },
                            {
                                name: "Position",
                                value: role.position.toString(),
                                inline: true
                            },
                            {
                                name: "Color",
                                value: role.hexColor,
                                inline: true
                            },
                            {
                                name: "Mentionable",
                                value: role.mentionable.toString(),
                                inline: true
                            },
                            {
                                name: "Hoisted",
                                value: role.hoist.toString(),
                                inline: true
                            },
                            {
                                name: "Managed",
                                value: role.managed.toString(),
                                inline: true
                            },
                            {
                                name: "Permissions",
                                value:
                                    role.permissions.toArray().length === 0
                                        ? "None"
                                        : role.permissions
                                              .toArray()
                                              .map(
                                                  perm => `\`${humanizeConstant(perm)}\``
                                              )
                                              .join(", ")
                            }
                        ],
                        footer: {
                            text: `Role ID: ${role.id} • Created on`
                        },
                        timestamp: role.createdAt
                    }
                ]
            })

            await role.guild.members.fetch()

            await roleMessage.edit({
                embeds: [
                    {
                        color: role.hexColor,
                        title: role.name,
                        thumbnail: {
                            url: iconUrlTemp? iconUrlTemp: undefined
                        },
                        fields: [
                            {
                                name: "Members",
                                value: role.members.size.toString(),
                                inline: true
                            },
                            {
                                name: "Position",
                                value: role.position.toString(),
                                inline: true
                            },
                            {
                                name: "Color",
                                value: role.hexColor,
                                inline: true
                            },
                            {
                                name: "Mentionable",
                                value: role.mentionable.toString(),
                                inline: true
                            },
                            {
                                name: "Hoisted",
                                value: role.hoist.toString(),
                                inline: true
                            },
                            {
                                name: "Managed",
                                value: role.managed.toString(),
                                inline: true
                            },
                            {
                                name: "Permissions",
                                value:
                                    role.permissions.toArray().length === 0
                                        ? "None"
                                        : role.permissions
                                              .toArray()
                                              .map(
                                                  perm => `\`${humanizeConstant(perm)}\``
                                              )
                                              .join(", ")
                            }
                        ],
                        footer: {
                            text: `Role ID: ${role.id} • Created on`
                        },
                        timestamp: role.createdAt
                    }
                ]
            })
        } else if (subcommand === "download") {
            if (
                !GuildMember.hasRole(
                    message.member,
                    globalThis.client.roles.SUBTEAM_LEAD ||
                        globalThis.client.roles.MANAGER,
                    client
                )
            )
                return
            await role.guild.members.fetch()
            const extended = args.consume("extended")

            let members: Array<Record<string, string | Array<string> | number>>

            if (extended === "extended") {
                members = role.members.map(m => {
                    return {
                        tag: m.user.tag,
                        id: m.user.id,
                        roles: m.roles.cache
                            .sort((a, b) => b.position - a.position)
                            .map(role => role.name)
                            .filter(role => role !== "@everyone"),
                        joinDate: m.user.createdTimestamp
                    }
                })
            } else {
                members = role.members.map(m => {
                    return {
                        tag: m.user.tag,
                        id: m.user.id
                    }
                })
            }

            const roleData = {
                name: role.name,
                id: role.id,
                createdTimestamp: role.createdTimestamp,
                icon: role.iconURL(),
                position: role.position,
                color: role.hexColor,
                unicode: role.unicodeEmoji,
                hoist: role.hoist,
                mentionable: role.mentionable,
                managed: role.managed,
                permissions: role.permissions.toArray(),
                members: members
            }

            const buf = Buffer.from(JSON.stringify(roleData, null, 4))
            const file = new Discord.MessageAttachment(buf, "roleData.json")
            await message.send({ files: [file] })
        }
    }
})
