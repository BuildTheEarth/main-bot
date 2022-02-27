import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles.util"
import CommandMessage from "../struct/CommandMessage"
import humanizeArray from "../util/humanizeArray.util"
import humanizeConstant from "../util/humanizeConstant.util"
import toggleDutyRole from "../util/toggleDutyRole.util"
import formatTimestamp from "../util/formatTimestamp.util"

//I'd like to to denote that I am not storing scheduling stuff in a database simply because it's not necessary, and is clutter, if the bot dies and somebodies support schedule dosnet work, the world will not end.

export default new Command({
    name: "duty",
    aliases: [],
    description: "Manage your on duty roles.",
    permission: [Roles.HELPER, Roles.SUPPORT, Roles.MODERATOR, Roles.MANAGER],
    subcommands: [
        {
            name: "add",
            description: "Add someone to duty.",
            permission: [Roles.HELPER, Roles.SUPPORT, Roles.MODERATOR, Roles.MANAGER],
            args: [
                {
                    name: "member",
                    description: "Member to add to duty.",
                    required: false,
                    optionType: "USER"
                },
                {
                    name: "role",
                    description: "Role to add to duty.",
                    required: false,
                    optionType: "STRING",
                    choices: ["SUPPORT", "MODERATOR"]
                }
            ]
        },
        {
            name: "schedule",
            description: "Schedule a duty role.",
            permission: [Roles.HELPER, Roles.SUPPORT, Roles.MODERATOR, Roles.MANAGER],
            args: [
                {
                    name: "time",
                    description: "Time to schedule the duty role for.",
                    required: true,
                    optionType: "USER"
                },
                {
                    name: "member",
                    description: "Member to add to duty.",
                    required: false,
                    optionType: "USER"
                },
                {
                    name: "role",
                    description: "Role to add to duty.",
                    required: false,
                    optionType: "STRING",
                    choices: ["SUPPORT", "MODERATOR"]
                }
            ]
        },
        {
            name: "cancel",
            description: "Cancel a duty schedule.",
            permission: [Roles.HELPER, Roles.SUPPORT, Roles.MODERATOR, Roles.MANAGER],
            args: [
                {
                    name: "member",
                    description: "Member to add to duty.",
                    required: false,
                    optionType: "USER"
                },
                {
                    name: "role",
                    description: "Role to add to duty.",
                    required: false,
                    optionType: "STRING",
                    choices: ["SUPPORT", "MODERATOR"]
                }
            ]
        },
        {
            name: "check",
            description: "Check duty status.",
            permission: [Roles.HELPER, Roles.SUPPORT, Roles.MODERATOR, Roles.MANAGER],
            args: [
                {
                    name: "member",
                    description: "Member to check duty status.",
                    required: false,
                    optionType: "USER"
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf([
            "set",
            "schedule",
            "cancel",
            "check"
        ])
        message.continue()
        if (subcommand === "set" || !subcommand) {
            const member = await args.consumeUser("member")
            const role = args.consumeIf(
                arg => ["support", "moderator"].includes(arg.toLowerCase()),
                "role"
            )
            const memberReal = member
                ? await client.customGuilds.main().members.fetch(member.id)
                : await client.customGuilds.main().members.fetch(message.member.id)
            const scheduledDuty = client.dutyScheduler.cancelWithCheck(
                memberReal,
                message.member
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let roleReal: any[]
            if (!role) roleReal = ["SUPPORT", "MODERATOR"]
            else roleReal = [role.toUpperCase()]
            const dutyArray = roleReal.filter(role =>
                GuildMember.hasRole(memberReal, Roles[role], client, false)
            )
            if (dutyArray.length === 0)
                return client.response.sendError(message, client.messages.cannotDuty)
            const toggle = await toggleDutyRole(
                memberReal,
                dutyArray as ("MODERATOR" | "SUPPORT")[],
                client
            )
            return client.response.sendSuccess(
                message,
                `${
                    message.member.id === memberReal.id
                        ? "*You* are"
                        : `<@${memberReal.id}> is`
                } now **${toggle ? "on" : "off"}** duty for ${humanizeArray(
                    dutyArray.map(ele => humanizeConstant(ele)),
                    false,
                    "and"
                )}${!scheduledDuty ? ` ${client.messages.scheduleCancelAuto}` : ""}.`
            )
        } else if (subcommand === "schedule") {
            const time = args.consumeLength("time")
            if (!time) return client.response.sendError(message, client.messages.noTime)
            if (time <= 0)
                return client.response.sendError(message, client.messages.slowmodeTooLow)
            const member = await args.consumeUser("member")
            const role = args.consumeIf(
                arg => ["support", "moderator"].includes(arg.toLowerCase()),
                "role"
            )
            const memberReal = member
                ? await client.customGuilds.main().members.fetch(member.id)
                : await client.customGuilds.main().members.fetch(message.member.id)
            const scheduledDuty = client.dutyScheduler.cancelWithCheck(
                memberReal,
                message.member
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let roleReal: any[]
            if (!role) roleReal = ["SUPPORT", "MODERATOR"]
            else roleReal = [role.toUpperCase()]
            const dutyArray = roleReal.filter(role =>
                GuildMember.hasRole(memberReal, Roles[role], client, false)
            )
            if (dutyArray.length === 0)
                return client.response.sendError(message, client.messages.cannotDuty)

            await client.dutyScheduler.scheduleDuty(
                time,
                memberReal,
                dutyArray as ("MODERATOR" | "SUPPORT")[]
            )

            return client.response.sendSuccess(
                message,
                `${client.messages.toggleScheduled}${
                    !scheduledDuty ? ` ${client.messages.scheduleCancelAuto}` : ""
                }.`
            )
        } else if (subcommand === "cancel") {
            const member = await args.consumeUser("member")
            const memberReal = member
                ? await client.customGuilds.main().members.fetch(member.id)
                : await client.customGuilds.main().members.fetch(message.member.id)
            const scheduledDuty = client.dutyScheduler.cancelWithCheck(
                memberReal,
                message.member
            )
            if (scheduledDuty) {
                return client.response.sendSuccess(
                    message,
                    client.messages.scheduleCancel
                )
            } else {
                return client.response.sendError(
                    message,
                    client.messages.noCancellableSchedule
                )
            }
        } else if (subcommand === "check") {
            const member = await args.consumeUser("member")
            const memberReal = member
                ? await client.customGuilds.main().members.fetch(member.id)
                : await client.customGuilds.main().members.fetch(message.member.id)
            const duty = await client.dutyScheduler.checkDuty(memberReal)
            if (duty !== null) {
                client.response.sendSuccess(
                    message,
                    `<@${memberReal.id}> has a duty schedule for ${formatTimestamp(
                        Math.floor(duty.getTime() / 1000),
                        "T"
                    )}`
                )
            } else {
                client.response.sendSuccess(
                    message,
                    `<@${memberReal.id}> does not have a duty schedule!`
                )
            }
        }
    }
})
