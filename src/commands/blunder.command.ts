import Command from "../struct/Command.js"

import Client from "../struct/Client.js"
import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"
import GuildMember from "../struct/discord/GuildMember.js"

import BlunderTracker from "../entities/BlunderTracker.entity.js"
import ApiTypes = require("discord-api-types/v10")
import { GuildTextBasedChannel } from "discord.js"
import typeorm from "typeorm"

export default new Command({
    name: "blunder",
    aliases: [],
    description: "Count the low amount of days since the staff team last made a blunder",
    permission: globalThis.client.roles.STAFF,
    subcommands: [
        {
            name: "commit",
            description:
                "admit to committing a blunder and reset the tracker. Resets tracker for your highest role if no ID",
            permission: globalThis.client.roles.STAFF,
            args: [
                {
                    name: "id",
                    description:
                        "blunder tracker ID, required if there are multiple trackers for your highest role",
                    required: false,
                    optionType: "INTEGER"
                }
            ]
        },
        {
            name: "new",
            description: "add a new blunder tracker",
            permission: globalThis.client.roles.MANAGER,
            args: [
                {
                    name: "team",
                    description: "team of whose blunders to track",
                    required: false,
                    optionType: "ROLE"
                },
                {
                    name: "channel",
                    description: "location of the blunder tracker",
                    required: true,
                    optionType: "CHANNEL",
                    channelTypes: [ApiTypes.ChannelType.GuildText]
                },
                {
                    name: "description",
                    description:
                        'what to display after "# days since <team> " or "# of days since "',
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "delete",
            description: "delete a blunder tracker",
            permission: globalThis.client.roles.MANAGER,
            args: [
                {
                    name: "id",
                    description: "blunder tracker ID",
                    required: true,
                    optionType: "INTEGER"
                }
            ]
        },
        {
            name: "list",
            description: "list blunder trackers available to you",
            permission: globalThis.client.roles.STAFF
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(["commit", "new", "delete", "list"])
        if (!subcommand) return message.sendErrorMessage("noSubcommand")

        const staffMember = await client.customGuilds
            .staff()
            .members.fetch(message.member.id)

        const canManage = message.member
            ? GuildMember.hasRole(
                  staffMember,
                  [
                      globalThis.client.roles.MANAGER,
                      globalThis.client.roles.LEAD_DEVELOPER,
                      globalThis.client.roles.PR_SUBTEAM_LEAD,
                      globalThis.client.roles.COMMUNITY_SUBTEAM_LEAD
                  ],
                  client
              )
            : false

        if (subcommand == "commit") {
            const id = parseInt(args.consume("id"))
            let blunder: BlunderTracker | undefined
            await message.continue()

            if (id) {
                blunder = await BlunderTracker.findOne(id)
                if (!blunder || !blunder.role)
                    return message.sendErrorMessage("invalidBlunderID")
                if (!staffMember.roles.cache.has(blunder.role) && !canManage)
                    return message.sendErrorMessage("noPerms")
            } else {
                const rolesDescending = staffMember.roles.cache.sort(
                    (roleA, roleB) => roleB.position - roleA.position
                )
                for (const role of rolesDescending.values()) {
                    const blunders = await BlunderTracker.find({
                        where: { role: role.id }
                    })
                    if (blunders.length == 0) continue
                    if (blunders.length > 1)
                        return message.sendErrorMessage("multipleBlunders")
                    blunder = blunders[0]
                    break
                }
            }
            if (!blunder) return message.sendErrorMessage("blunderNotFound")
            await blunder.reset(client)
            await message.sendSuccessMessage("blunderCommitted")
        } else if (subcommand == "new") {
            if (!canManage) return message.sendErrorMessage("noPerms")

            const role = await args.consumeRole("team")

            const channel = await args.consumeChannel("channel")
            if (!channel || !channel.isText())
                return message.sendErrorMessage("noChannel")
            if (
                (channel as GuildTextBasedChannel).guild?.id !==
                client.customGuilds.staff().id
            )
                return message.sendErrorMessage("staffChannelRequired")

            const description = args.consumeRest(["description"])
            if (!description) return message.sendErrorMessage("noDescription")

            await message.continue()

            const blunder = new BlunderTracker()
            blunder.lastBlunder = undefined
            blunder.role = role?.id || undefined
            blunder.channel = channel.id
            blunder.description = description

            const msg = await channel.send(
                `\`unknown\` days since ${
                    blunder.role ? (await blunder.roleToTeam(client)) + " " : ""
                }${blunder.description}`
            )
            blunder.message = msg.id
            await blunder.save()
            await message.sendSuccessMessage("blunderTrackerCreated")
        } else if (subcommand == "delete") {
            if (!canManage) return message.sendErrorMessage("noPerms")

            const id = parseInt(args.consume("id"))
            if (id) {
                await message.continue()

                const blunder = await BlunderTracker.findOne(id)
                if (!blunder) return message.sendErrorMessage("invalidBlunderID")

                const msg = await (
                    client.channels.cache.get(blunder.channel) as GuildTextBasedChannel
                ).messages.fetch(blunder.message)
                await msg?.delete()
                await blunder.remove()
                await message.sendSuccessMessage("blunderTrackerDeleted", id)
            } else message.sendErrorMessage("noBlunderID")
        } else if (subcommand == "list") {
            let findOptions = {}
            if (!canManage)
                findOptions = {
                    where: [
                        {
                            role: typeorm.In([...staffMember.roles.cache.keys()])
                        },
                        { role: typeorm.IsNull() }
                    ]
                }
            await message.continue()

            const blunders = await BlunderTracker.find(findOptions)

            await message.sendSuccess({
                title: message.getMessage("yourBlunderTrackers"),
                description:
                    blunders
                        .map(
                            blunder =>
                                `[**${blunder.id}:**](https://discord.com/channels/${
                                    staffMember.guild.id
                                }/${blunder.channel}/${blunder.message}) days since ${
                                    blunder.role ? `<@&${blunder.role}> ` : ""
                                }${blunder.description}`
                        )
                        .join("\n") || "None :(",
                footer: { text: message.getMessage("blunderDisclaimer") }
            })
        }
    }
})
