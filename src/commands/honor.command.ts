import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Guild from "../struct/discord/Guild.js"

import { humanizeArray, ms, noop } from "@buildtheearth/bot-utils"
import AdvancedBuilder from "../entities/AdvancedBuilder.entity.js"
import CommandMessage from "../struct/CommandMessage.js"
import Discord from "discord.js"

export default new Command({
    name: "honor",
    aliases: ["advance"],
    description: "Add or remove a user as an honored builder.",
    permission: [
        globalThis.client.roles.BUILDER_COUNCIL,
        globalThis.client.roles.MANAGER
    ],
    args: [
        {
            name: "user",
            description: "User to advance.",
            required: true,
            optionType: "USER"
        },
        {
            name: "type",
            description: "The type of special builder role!",
            required: true,
            optionType: "STRING",
            choices: ["advanced", "cool_build"]
        },
        {
            name: "demote",
            description: "Optional arg to demote advanced builder",
            required: false,
            optionType: "STRING",
            choices: ["remove"]
        }
    ],
    async run(client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("user")
        const type = args.consumeIf(["advanced", "cool_build"], "type")
        if (!type) {
            return message.sendErrorMessage(
                "chooseBuilder",
                humanizeArray(["advanced", "cool_build"], true, "or")
            )
        }

        const roleName =
            type.toLowerCase() === "cool_build" ? "COOL_BUILD" : "ADVANCED_BUILDER"

        const remove = !!args.consumeIf("remove", "demote")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")

        const member = await (await client.customGuilds.main()).members
            .fetch({ user, cache: true })
            .catch(noop)
        if (
            !member ||
            !GuildMember.hasRole(member, globalThis.client.roles.BUILDER, client)
        )
            return message.sendErrorMessage("noBuilder")
        const role = Guild.role(await client.customGuilds.main(), client.roles[roleName])

        await message.continue()

        if (remove) {
            const record = await AdvancedBuilder.findOne(user.id, {
                where: { roleName: roleName }
            })
            if (!record) return message.sendErrorMessage("notAdvancedBuilder")
            await record.removeBuilder(client)
            return message.sendSuccessMessage("removedUser", user)
        } else {
            const existingRecord = await AdvancedBuilder.findOne(user.id)
            if (existingRecord) {
                const oldTime = existingRecord.givenAt
                existingRecord.givenAt = new Date()
                await existingRecord.save()
                existingRecord.schedule(client)

                oldTime.setMonth(oldTime.getMonth() + 3)
                const formattedTime = ms(oldTime.getTime() - Date.now(), { long: true })

                return message.sendSuccessMessage(
                    "honoredUserExisting",
                    user,
                    formattedTime
                )
            } else {
                const record = new AdvancedBuilder()
                record.builder = user.id
                record.roleName = roleName as "COOL_BUILD" | "ADVANCED_BUILDER"
                await record.save()
                record.schedule(client)
                await member.roles.add(role)

                if (client.roles[roleName] === globalThis.client.roles.COOL_BUILD) {
                    let progressChannel = client.customGuilds
                        .main()
                        .channels.cache.find(
                            ch => ch.name == "builder-chat"
                        ) as Discord.TextChannel
                    if (!progressChannel) {
                        progressChannel = client.customGuilds
                            .main()
                            .channels.cache.find(
                                ch => ch.name == "builders-chat"
                            ) as Discord.TextChannel
                    }
                    if (progressChannel) {
                        await client.response.sendSuccess(
                            progressChannel,
                            message.getMessage("honoredProgressMessage", user)
                        )
                    }
                    return message.sendSuccessMessage("honoredUserNew", user)
                }

                if (client.roles[roleName] === globalThis.client.roles.ADVANCED_BUILDER) {
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
                    return message.sendSuccessMessage("honoredUserNew", user)
                }
            }
        }
    }
})
