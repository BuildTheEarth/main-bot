import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import ActionLog from "../entities/ActionLog"
import Roles from "../util/roles"
import GuildMember from "../struct/discord/GuildMember"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "case",
    aliases: ["record"],
    description: "Check specific info on a case.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    basesubcommand: "check",
    args: [
        {
            name: "id",
            description: "Case ID",
            required: true,
            optionType: "STRING"
        }
    ],
    subcommands: [
        {
            name: "edit",
            description: "Edit a case.",
            permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
            args: [
                {
                    name: "id",
                    description: "Case ID",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "image_url",
                    description: "Image URL (required if used as slashcommand).",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "reason",
                    description: "New case Reason",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a case.",
            permission: [Roles.MODERATOR, Roles.MANAGER],
            args: [
                {
                    name: "id",
                    description: "Case ID",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "reason",
                    description: "Deletion Reason",
                    required: true,
                    optionType: "STRING"
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(["edit", "delete", "check"])
        const id = Number(args.consume("id"))
        if (Number.isNaN(id))
            return client.response.sendError(message, client.messages.noCaseId)

        await message.continue()

        const log = await ActionLog.getRepository()
            .createQueryBuilder()
            .withDeleted()
            .andWhere({id: id})
            .getOne()

        if (!log)
            return client.response.sendError(message, `Couldn't find case **#${id}**.`)

        if (!["edit", "delete"].includes(subcommand)) {
            const embed = await log.displayEmbed(client)
            await message.send({ embeds: [embed] })
        } else if (subcommand === "edit") {
            const image = args.consumeImage("image_url")
            const reason = args.consumeRest(["reason"])
            if (!reason && !image)
                return client.response.sendError(message, client.messages.noNewReason)
            if (reason === log.reason && !image)
                return client.response.sendError(message, client.messages.noChange)

            if (image) log.reasonImage = image
            if (reason) log.reason = reason
            await log.save()
            await log.updateNotification(client)
            await client.response.sendError(message, `Edited case **#${id}**.`, false)
            await client.log(log)
        } else if (subcommand === "delete") {
            if (!GuildMember.hasRole(message.member, Roles.MODERATOR, client))
                return client.response.sendError(message, client.messages.noPerms)
            const reason = args.consumeRest(["reason"])
            if (!reason)
                return client.response.sendError(
                    message,
                    client.messages.noDeletionReason
                )
            if (log.deletedAt)
                return client.response.sendError(message, client.messages.alreadyDeleted)

            log.deletedAt = new Date()
            log.deleter = message.member.user.id
            log.deleteReason = reason
            await log.save()
            await client.response.sendSuccess(message, `Deleted case **#${id}**.`)
            await client.log(log)
        }
    }
})
