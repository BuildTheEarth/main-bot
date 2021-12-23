import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Guild from "../struct/discord/Guild"
import Roles from "../util/roles"
import noop from "../util/noop"
import AdvancedBuilder from "../entities/AdvancedBuilder"
import ms from "ms"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "advance",
    aliases: ["advanced"],
    description: "Add or remove a user as an advanced builder.",
    permission: [Roles.BUILDER_COUNCIL, Roles.MANAGER],
    args: [
        {
            name: "user",
            description: "User to advance.",
            required: true,
            optionType: "USER"
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
        const remove = !!args.consumeIf("demote", "remove")
        if (!user)
            return client.response.sendError(
                message,
                user === undefined
                    ? "You must provide a user to manage!"
                    : "Couldn't find that user."
            )

        const member = await (await client.customGuilds.main()).members
            .fetch({ user, cache: true })
            .catch(noop)
        if (!member || !GuildMember.hasRole(member, Roles.BUILDER))
            return client.response.sendError(message, "That user is not a builder.")
        const role = Guild.role(await client.customGuilds.main(), Roles.ADVANCED_BUILDER)

        await message.continue()

        if (remove) {
            const record = await AdvancedBuilder.findOne(user.id)
            if (!record)
                return client.response.sendError(
                    message,
                    "That user is not an advanced builder."
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
                    `Advanced ${user} for 3 months (it was going to end in ${formattedTime}).`
                )
            } else {
                const record = new AdvancedBuilder()
                record.builder = user.id
                await record.save()
                record.schedule(client)
                await member.roles.add(role)

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
                    `Advanced ${user} for 3 months.`
                )
            }
        }
    }
})
