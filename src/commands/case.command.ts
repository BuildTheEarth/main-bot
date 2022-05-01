import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import ActionLog from "../entities/ActionLog.entity.js"

import GuildMember from "../struct/discord/GuildMember.js"
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "case",
    aliases: [],
    description: "Check specific info on a case.",
    permission: [
        globalThis.client.roles.HELPER,
        globalThis.client.roles.MODERATOR,
        globalThis.client.roles.MANAGER
    ],
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
            permission: [
                globalThis.client.roles.HELPER,
                globalThis.client.roles.MODERATOR,
                globalThis.client.roles.MANAGER
            ],
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
            permission: [
                globalThis.client.roles.MODERATOR,
                globalThis.client.roles.MANAGER
            ],
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
        if (Number.isNaN(id)) return message.sendErrorMessage("noCaseId")

        await message.continue()

        const log = await ActionLog.getRepository()
            .createQueryBuilder()
            .withDeleted()
            .andWhere({ id: id })
            .getOne()

        if (!log) return message.sendErrorMessage("noCaseFound", id)

        if (!["edit", "delete"].includes(subcommand)) {
            const embed = await log.displayEmbed(client)
            await message.send({ embeds: [embed] })
        } else if (subcommand === "edit") {
            const image = args.consumeImage("image_url")
            const reason = client.placeholder.replacePlaceholders(
                args.consumeRest(["reason"])
            )
            if (!reason && !image) return message.sendErrorMessage("noNewReason")
            if (reason === log.reason && !image)
                return message.sendErrorMessage("noChange")

            if (image) log.reasonImage = image
            if (reason) log.reason = reason
            await log.save()
            await log.updateNotification(client)
            await message.sendErrorMessageSeen("editedCase", id)
            await client.log(log)
        } else if (subcommand === "delete") {
            if (
                !GuildMember.hasRole(
                    message.member,
                    globalThis.client.roles.MODERATOR,
                    client
                )
            )
                return message.sendErrorMessage("noPerms")
            const reason = args.consumeRest(["reason"])
            if (!reason) return message.sendErrorMessage("noDeletionReason")
            if (log.deletedAt) return message.sendErrorMessage("alreadyDeleted")

            log.deletedAt = new Date()
            log.deleter = message.member.user.id
            log.deleteReason = reason
            await log.save()
            await message.sendSuccessMessage("deletedCase", id)
            await client.log(log)
        }
    }
})
