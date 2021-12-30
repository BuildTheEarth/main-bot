import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"
import Args from "../struct/Args"
import humanizeConstant from "../util/humanizeConstant"
import GuildMember from "../struct/discord/GuildMember"
import Discord from "discord.js"

export default new Command({
    name: "role",
    aliases: ["roleinfo", "downloadmembers", "memberlist"],
    description: "View information about a role.",
    permission: Roles.ANY,
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
            permission: [Roles.SUBTEAM_LEAD, Roles.MANAGER],
            args: [
                {
                    name: "role",
                    description: "The role to download.",
                    required: true,
                    optionType: "ROLE"
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(["view", "download"])
        const role = await args.consumeRole("role")
        if (!role) {
            return client.response.sendError(message, client.messages.noRole)
        }
        await message.continue()

        if (!["download"].includes(subcommand)) {
            await message.send({
                embeds: [
                    {
                        color: role.hexColor,
                        title: role.name,
                        thumbnail: {
                            url: role.iconURL()
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
            if (!GuildMember.hasRole(message.member, Roles.SUBTEAM_LEAD || Roles.MANAGER))
                return
            await role.guild.members.fetch()
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
                members: role.members.map(m => {
                    const container = {}
                    container["tag"] = m.user.tag
                    container["id"] = m.user.id
                    return container
                })
            }

            const buf = Buffer.from(JSON.stringify(roleData, null, 4))
            const file = new Discord.MessageAttachment(buf, "roleData.json")
            await message.send({ files: [file] })
        }
    }
})
