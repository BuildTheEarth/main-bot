import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import GuildMember from "../struct/discord/GuildMember.js"
import CommandMessage from "../struct/CommandMessage.js"
import toggleDutyRole from "../util/toggleDutyRole.util.js"
import {
    formatTimestamp,
    humanizeArray,
    humanizeConstant
} from "@buildtheearth/bot-utils"

//I'd like to to denote that I am not storing scheduling stuff in a database simply because it's not necessary, and is clutter, if the bot dies and somebodies support schedule dosnet work, the world will not end.

export default new Command({
    name: "duty",
    aliases: [],
    description: "Manage your on duty roles.",
    permission: [
        globalThis.client.roles.HELPER,
        globalThis.client.roles.SUPPORT,
        globalThis.client.roles.MODERATOR,
        globalThis.client.roles.MANAGER
    ],
    subcommands: [
        {
            name: "add",
            description: "Add someone to duty.",
            permission: [
                globalThis.client.roles.HELPER,
                globalThis.client.roles.SUPPORT,
                globalThis.client.roles.MODERATOR,
                globalThis.client.roles.MANAGER
            ],
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
                    choices: ["SUPPORT", "MODERATOR", "HELPER"]
                }
            ]
        },
        {
            name: "schedule",
            description: "Schedule a duty role.",
            permission: [
                globalThis.client.roles.HELPER,
                globalThis.client.roles.SUPPORT,
                globalThis.client.roles.MODERATOR,
                globalThis.client.roles.MANAGER
            ],
            args: [
                {
                    name: "time",
                    description: "Time to schedule the duty role for.",
                    required: true,
                    optionType: "STRING"
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
                    choices: ["SUPPORT", "MODERATOR", "HELPER"]
                }
            ]
        },
        {
            name: "cancel",
            description: "Cancel a duty schedule.",
            permission: [
                globalThis.client.roles.HELPER,
                globalThis.client.roles.SUPPORT,
                globalThis.client.roles.MODERATOR,
                globalThis.client.roles.MANAGER
            ],
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
                    choices: ["SUPPORT", "MODERATOR", "HELPER"]
                }
            ]
        },
        {
            name: "check",
            description: "Check duty status.",
            permission: [
                globalThis.client.roles.HELPER,
                globalThis.client.roles.SUPPORT,
                globalThis.client.roles.MODERATOR,
                globalThis.client.roles.MANAGER
            ],
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
        await message.continue()
        if (subcommand === "add" || !subcommand) {
            const member = await args.consumeUser("member")
            const role = args.consumeIf(
                arg => ["support", "moderator", "helper"].includes(arg.toLowerCase()),
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
            if (!role) roleReal = ["SUPPORT", "MODERATOR", "HELPER"]
            else roleReal = [role.toUpperCase()]
            const dutyArray = roleReal.filter(role =>
                GuildMember.hasRole(memberReal, client.roles[role], client, false)
            )
            if (dutyArray.length === 0)
                return client.response.sendError(message, message.messages.cannotDuty)
            const toggle = await toggleDutyRole(
                memberReal,
                dutyArray as ("MODERATOR" | "SUPPORT" | "HELPER")[],
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
                )}${!scheduledDuty ? ` ${message.messages.scheduleCancelAuto}` : ""}.`
            )
        } else if (subcommand === "schedule") {
            const time = args.consumeLength("time")
            if (!time) return client.response.sendError(message, message.messages.noTime)
            if (time <= 0)
                return client.response.sendError(message, message.messages.slowmodeTooLow)
            const member = await args.consumeUser("member")
            const role = args.consumeIf(
                arg => ["support", "moderator", "helper"].includes(arg.toLowerCase()),
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
            if (!role) roleReal = ["SUPPORT", "MODERATOR", "HELPER"]
            else roleReal = [role.toUpperCase()]
            const dutyArray = roleReal.filter(role =>
                GuildMember.hasRole(memberReal, client.roles[role], client, false)
            )
            if (dutyArray.length === 0)
                return client.response.sendError(message, message.messages.cannotDuty)

            await client.dutyScheduler.scheduleDuty(
                time,
                memberReal,
                dutyArray as ("MODERATOR" | "SUPPORT" | "HELPER")[]
            )

            return client.response.sendSuccess(
                message,
                `${message.messages.toggleScheduled}${
                    !scheduledDuty ? ` ${message.messages.scheduleCancelAuto}` : ""
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
                    message.messages.scheduleCancel
                )
            } else {
                return client.response.sendError(
                    message,
                    message.messages.noCancellableSchedule
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
