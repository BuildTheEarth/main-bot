import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"
import BotGuild from "../struct/discord/BotGuild.js"

import {
    formatTimestamp,
    humanizeArray,
    humanizeConstant,
    ms,
    noop
} from "@buildtheearth/bot-utils"
import AdvancedBuilder from "../entities/AdvancedBuilder.entity.js"
import CommandMessage from "../struct/CommandMessage.js"
import { TextChannel } from "discord.js"

export default new Command({
    name: "honor",
    aliases: ["advance"],
    description: "Add or remove a user as an honored builder.",
    inheritGlobalArgs: true,
    permission: [
        globalThis.client.roles.BUILDER_COUNCIL,
        globalThis.client.roles.MANAGER
    ],
    args: [
        {
            name: "user",
            description: "User to honor.",
            required: true,
            optionType: "USER"
        }
    ],

    subcommands: [
        {
            name: "add",
            description: "Honor a new builder",
            args: [
                {
                    name: "duration",
                    description: "The duration of honor (in months)",
                    optionType: "NUMBER",
                    required: true
                },
                {
                    name: "type",
                    description: "The type of special builder role!",
                    required: true,
                    optionType: "STRING",
                    choices: ["advanced", "cool_build"]
                }
            ]
        },
        {
            name: "demote",
            description: "Demote a honored builder",
            args: []
        },
        {
            name: "extend",
            description: "Extend the duration for an honored builder",
            args: [
                {
                    name: "duration",
                    description: "The duration to extend by (in months)",
                    optionType: "NUMBER",
                    required: true
                },
                {
                    name: "type",
                    description: "The type of special builder role!",
                    required: true,
                    optionType: "STRING",
                    choices: ["advanced", "cool_build"]
                }
            ]
        },
        {
            name: "lower",
            description: "Lower the duration for an honored builder",
            args: [
                {
                    name: "duration",
                    description: "The duration to lower by (in months)",
                    optionType: "NUMBER",
                    required: true
                },
                {
                    name: "type",
                    description: "The type of special builder role!",
                    required: true,
                    optionType: "STRING",
                    choices: ["advanced", "cool_build"]
                }
            ]
        },
        {
            name: "info",
            description: "Give info about a honored builder",
            args: []
        }
    ],

    async run(client: BotClient, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommand()
        const user = await args.consumeUser("user")

        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")

        const member = await (await client.customGuilds.main()).members
            .fetch({ user, cache: true })
            .catch(noop)
        if (
            !member ||
            !BotGuildMember.hasRole(member, globalThis.client.roles.BUILDER, client)
        )
            return message.sendErrorMessage("noBuilder")

        await message.continue()

        if (subcommand == "info") {
            const record = await AdvancedBuilder.findOne(user.id)

            if (!record) return message.sendErrorMessage("notAdvancedBuilder")
            else {
                const expire = new Date(record.givenAt.getTime())

                expire.setMonth(record.givenAt.getMonth() + record.duration)

                return message.sendSuccess({
                    title: "Honor Info",
                    thumbnail: {
                        url:
                            member.displayAvatarURL({
                                size: 128,
                                extension: "png",
                                forceStatic: false
                            }) || "https://cdn.discordapp.com/embed/avatars/5.png"
                    },

                    description: `Honor info for <@${member.id}>`,

                    fields: [
                        {
                            name: "Role",
                            value: humanizeConstant(record.roleName)
                        },
                        {
                            name: "Expiry Date",
                            value: formatTimestamp(expire)
                        }
                    ]
                })
            }
        }

        if (subcommand == "demote") {
            const record = await AdvancedBuilder.findOne(user.id)
            if (!record) return message.sendErrorMessage("notAdvancedBuilder")
            await record.removeBuilder(client)
            return message.sendSuccessMessage("removedUser", user)
        } else {
            const type = args.consumeIf(["advanced", "cool_build"], "type")
            if (!type) {
                return message.sendErrorMessage(
                    "chooseBuilder",
                    humanizeArray(["advanced", "cool_build"], true, "or")
                )
            }

            const roleName =
                type.toLowerCase() === "cool_build" ? "COOL_BUILD" : "ADVANCED_BUILDER"

            const role = BotGuild.role(
                await client.customGuilds.main(),
                client.roles[roleName]
            )

            const durationReal = args.consumeNumber("duration")

            let duration = durationReal

            if (!duration || duration < 0) duration = 3

            const existingRecord = await AdvancedBuilder.findOne(user.id)

            if (subcommand == "add") {
                if (existingRecord) {
                    const oldTime = existingRecord.givenAt
                    existingRecord.givenAt = new Date()
                    existingRecord.duration = duration
                    await existingRecord.save()
                    existingRecord.schedule(client)

                    oldTime.setMonth(oldTime.getMonth() + existingRecord.duration)
                    const formattedTime = ms(oldTime.getTime() - Date.now(), {
                        long: true
                    })

                    return message.sendSuccessMessage(
                        "honoredUserExisting",
                        user,
                        duration,
                        formattedTime
                    )
                } else {
                    const record = new AdvancedBuilder()
                    record.builder = user.id
                    record.duration = duration
                    record.roleName = roleName as "COOL_BUILD" | "ADVANCED_BUILDER"
                    await record.save()
                    record.schedule(client)
                    await member.roles.add(role)

                    if (client.roles[roleName] === globalThis.client.roles.COOL_BUILD) {
                        let progressChannel = client.customGuilds
                            .main()
                            .channels.cache.find(
                                ch => ch.name == "builder-chat"
                            ) as TextChannel
                        if (!progressChannel) {
                            progressChannel = client.customGuilds
                                .main()
                                .channels.cache.find(
                                    ch => ch.name == "builders-chat"
                                ) as TextChannel
                        }
                        if (progressChannel) {
                            await client.response.sendSuccess(
                                progressChannel,
                                message.getMessage("honoredProgressMessage", user)
                            )
                        }
                        return message.sendSuccessMessage(
                            "honoredUserNew",
                            user,
                            duration
                        )
                    }

                    if (
                        client.roles[roleName] ===
                        globalThis.client.roles.ADVANCED_BUILDER
                    ) {
                        await user
                            .createDM()
                            .then(dms =>
                                dms.send({
                                    embeds: [
                                        {
                                            color: role.color,
                                            description:
                                                "You have been added as an advanced builder. Good job!"
                                        }
                                    ]
                                })
                            )
                            .catch(noop)
                        return message.sendSuccessMessage(
                            "honoredUserNew",
                            user,
                            duration
                        )
                    }
                }
            } else {
                if (!durationReal || durationReal == 0)
                    return message.sendErrorMessage("zeroDuration")

                let newDuration = Math.abs(durationReal)

                if (subcommand == "lower") {
                    newDuration = -newDuration
                }

                if (!existingRecord) return message.sendErrorMessage("honorDNE")

                const res = existingRecord.extend(client, newDuration)

                if (!res) return message.sendErrorMessage("slowmodeTooLow")

                const expire = new Date(existingRecord.givenAt.getTime())

                expire.setMonth(
                    existingRecord.givenAt.getMonth() + existingRecord.duration
                )

                return message.sendSuccessMessage(
                    "validUntilHonor",
                    formatTimestamp(expire)
                )
            }
        }
    }
})
