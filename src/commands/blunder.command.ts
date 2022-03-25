import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
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
    permission: Roles.STAFF,
    subcommands: [
        {
            name: "commit",
            description:
                "admit to committing a blunder and reset the tracker. Resets tracker for your highest role if no ID",
            permission: Roles.STAFF,
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
            permission: Roles.MANAGER,
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
            permission: Roles.MANAGER,
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
            permission: Roles.STAFF
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(["commit", "new", "delete", "list"])
        if (!subcommand)
            return client.response.sendError(message, client.messages.noSubcommand)

        const staffMember = await client.customGuilds
            .staff()
            .members.fetch(message.member.id)

        const canManage = message.member
            ? GuildMember.hasRole(
                  staffMember,
                  [
                      Roles.MANAGER,
                      Roles.LEAD_DEVELOPER,
                      Roles.PR_SUBTEAM_LEAD,
                      Roles.COMMUNITY_SUBTEAM_LEAD
                  ],
                  client
              )
            : false

        if (subcommand == "commit") {
            const id = parseInt(args.consume("id"))
            let blunder: BlunderTracker
            await message.continue()

            if (id) {
                blunder = await BlunderTracker.findOne(id)
                if (!blunder)
                    return client.response.sendError(
                        message,
                        client.messages.invalidBlunderID
                    )
                if (!staffMember.roles.cache.has(blunder.role) && !canManage)
                    return client.response.sendError(message, client.messages.noPerms)
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
                        return client.response.sendError(
                            message,
                            client.messages.multipleBlunders
                        )
                    blunder = blunders[0]
                    break
                }
            }
            if (!blunder)
                return client.response.sendError(message, client.messages.blunderNotFound)
            await blunder.reset(client)
            client.response.sendSuccess(message, client.messages.blunderCommitted)
        } else if (subcommand == "new") {
            if (!canManage)
                return client.response.sendError(message, client.messages.noPerms)

            const role = await args.consumeRole("team")

            const channel = await args.consumeChannel("channel")
            if (!channel || !channel.isText())
                return client.response.sendError(message, client.messages.noChannel)
            if (
                (channel as GuildTextBasedChannel).guild?.id !==
                client.customGuilds.staff().id
            )
                return client.response.sendError(
                    message,
                    client.messages.staffChannelRequired
                )

            const description = args.consumeRest(["description"])
            if (!description)
                return client.response.sendError(message, client.messages.noDescription)

            await message.continue()

            const blunder = new BlunderTracker()
            blunder.lastBlunder = null
            blunder.role = role?.id || null
            blunder.channel = channel.id
            blunder.description = description

            const msg = await channel.send(
                `\`unknown\` days since ${
                    blunder.role ? (await blunder.roleToTeam(client)) + " " : ""
                }${blunder.description}`
            )
            blunder.message = msg.id
            await blunder.save()
            client.response.sendSuccess(message, "Blunder Tracker created!")
        } else if (subcommand == "delete") {
            if (!canManage)
                return client.response.sendError(message, client.messages.noPerms)

            const id = parseInt(args.consume("id"))
            if (id) {
                await message.continue()

                const blunder = await BlunderTracker.findOne(id)
                if (!blunder)
                    return client.response.sendError(
                        message,
                        client.messages.invalidBlunderID
                    )

                const msg = await (
                    client.channels.cache.get(blunder.channel) as GuildTextBasedChannel
                ).messages.fetch(blunder.message)
                await msg?.delete()
                await blunder.remove()
                client.response.sendSuccess(message, `Blunder tracker \`${id}\` deleted!`)
            } else client.response.sendError(message, client.messages.noBlunderID)
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

            client.response.sendSuccess(message, {
                title: "Blunder Trackers available to you:",
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
                footer: { text: "number is tracker ID, not the number of days" }
            })
        }
    }
})
