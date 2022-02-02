import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Guild from "../struct/discord/Guild"
import Roles from "../util/roles"
import noop from "../util/noop"
import AdvancedBuilder from "../entities/AdvancedBuilder"
import ms from "../util/ms"
import CommandMessage from "../struct/CommandMessage"
import humanizeArray from "../util/humanizeArray"
import Discord from "discord.js"

export default new Command({
    name: "honor",
    aliases: ["advance", "coolbuild"],
    description: "Add or remove a user as an honored builder.",
    permission: [Roles.BUILDER_COUNCIL, Roles.MANAGER],
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
            return client.response.sendError(message, `Please choose the type from one of ${humanizeArray(["advanced", "cool_build"], true, "or")}`)
        }

        const roleName = (type.toLowerCase() === "cool_build")? "COOL_BUILD":"ADVANCED_BUILDER"

        const remove = !!args.consumeIf("remove", "demote")
        if (!user)
            return client.response.sendError(
                message,
                user === undefined ? client.messages.noUser : client.messages.invalidUser
            )

        const member = await (await client.customGuilds.main()).members
            .fetch({ user, cache: true })
            .catch(noop)
        if (!member || !GuildMember.hasRole(member, Roles.BUILDER))
            return client.response.sendError(message, client.messages.noBuilder)
        const role = Guild.role(await client.customGuilds.main(), Roles[roleName])

        await message.continue()

        if (remove) {
            const record = await AdvancedBuilder.findOne(user.id, {where: {roleName: roleName}})
            if (!record)
                return client.response.sendError(
                    message,
                    client.messages.notAdvancedBuilder
                )
            await record.removeBuilder(client)
            return client.response.sendSuccess(message, `Removed ${user}.`)
        } else {
            const existingRecord = await AdvancedBuilder.findOne(user.id)
            if (existingRecord) {
                const oldTime = existingRecord.givenAt
                existingRecord.givenAt = new Date()
                await existingRecord.save()
                existingRecord.schedule(client)

                oldTime.setMonth(oldTime.getMonth() + 3)
                const formattedTime = ms(oldTime.getTime() - Date.now(), { long: true })

                return client.response.sendSuccess(
                    message,
                    `Honored ${user} for 3 months (it was going to end in ${formattedTime}).`
                )
            } else {
                const record = new AdvancedBuilder()
                record.builder = user.id
                record.roleName = roleName as ("COOL_BUILD" | "ADVANCED_BUILDER")
                await record.save()
                record.schedule(client)
                await member.roles.add(role)

                if (Roles[roleName] === Roles.COOL_BUILD) {
                    let progressChannel = client.customGuilds
                    .main()
                    .channels.cache.find(
                        ch => ch.name == "progress"
                    ) as Discord.TextChannel
                    if (!progressChannel) {
                        progressChannel = client.customGuilds
                        .main()
                        .channels.cache.find(
                            ch => ch.name == "pogress"
                        ) as Discord.TextChannel
                    }
                    if (progressChannel) {
                        client.response.sendSuccess(progressChannel, `<@${user.id}> has been awarded for their cool build! Congratulations and great work!`)
                    }
                    return client.response.sendSuccess(
                        message,
                        `Honored ${user} for 3 months.`
                    )
                }

                if (Roles[roleName] === Roles.ADVANCED_BUILDER) {

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
                    return client.response.sendSuccess(
                        message,
                        `Honored ${user} for 3 months.`
                    )
                }
            }
        }
    }
})
