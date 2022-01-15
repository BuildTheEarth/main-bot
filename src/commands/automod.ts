import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"
import Args from "../struct/Args"
import humanizeArray from "../util/humanizeArray"
import BannedWord from "../entities/BannedWord"

const punishmentTypes = ["BAN", "MUTE", "KICK", "WARN"]

export default new Command({
    name: "automod",
    aliases: ["blockword", "blockedwords"],
    description: "Manage banned words",
    subcommands: [
        {
            name: "block",
            description: "Manage blocked words",
            group: true,
            subcommands: [
                {
                    name: "add",
                    description: "Add a blocked word",
                    seperator: " | ",
                    args: [
                        {
                            name: "word",
                            description: "Word to block.",
                            required: true,
                            optionType: "STRING"
                        },
                        {
                            name: "punishment",
                            description: "Punishment to give",
                            required: true,
                            optionType: "STRING",
                            choices: punishmentTypes
                        },
                        {
                            name: "reason",
                            description: "Punishment reason.",
                            required: true,
                            optionType: "STRING"
                        },
                        {
                            name: "duration",
                            description: "Punishment duration.",
                            required: false,
                            optionType: "STRING"
                        }
                    ]
                },
                {
                    name: "remove",
                    description: "Remove a blocked word",
                    args: [
                        {
                            name: "word",
                            description: "Word to remove.",
                            required: true,
                            optionType: "STRING"
                        }
                    ]
                },
                {
                    name: "list",
                    description: "List all blocked words."
                }
            ]
        },
        {
            name: "except",
            description: "Manage exceptions",
            group: true,
            subcommands: [
                {
                    name: "add",
                    description: "Add an exception",
                    args: [
                        {
                            name: "word",
                            description: "Word to except.",
                            required: true,
                            optionType: "STRING"
                        }
                    ]
                },
                {
                    name: "remove",
                    description: "Remove a blocked word",
                    args: [
                        {
                            name: "word",
                            description: "Word to remove from exceptions.",
                            required: true,
                            optionType: "STRING"
                        }
                    ]
                },
                {
                    name: "list",
                    description: "List all exceptions."
                }
            ]
        }
    ],
    permission: [Roles.MODERATOR, Roles.MANAGER, Roles.ANY],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommandGroup = args.consumeSubcommandGroupIf(["block", "except"])
        if (!subcommandGroup)
            return client.response.sendError(
                message,
                `Specify a valid subcommand group of ${humanizeArray(
                    this.subcommands.map(ele => ele.name)
                )}`
            )
        if (subcommandGroup === "block") {
            const validSubcommands = ["add", "remove", "list"]
            const subcommand = args.consumeSubcommandIf(validSubcommands)
            if (!subcommand || subcommand === "list") {
                client.response.sendSuccess(message, `The word has been deleted!`)
            }
            if (subcommand === "add") {
                args.separator = "|"
                const word = args.consume("word")
                if (!word)
                    return await client.response.sendError(
                        message,
                        `Please specify a word.`
                    )
                const punishment = args.consume("punishment").toUpperCase()
                console.log(punishment)
                if (!punishmentTypes.includes(punishment))
                    return await client.response.sendError(
                        message,
                        `Specify a valid punishment type of ${humanizeArray(
                            punishmentTypes
                        )}`
                    )
                const reason = args.consume("reason")
                if (!reason)
                    return await client.response.sendError(
                        message,
                        `Please specify a reason.`
                    )
                const duration = args.consumeLength("duration")
                if (duration === null && punishment !== "WARN" && punishment !== "KICK")
                    return await client.response.sendError(
                        message,
                        "You must provide a duration for Mutes and Bans!"
                    )
                const isAlreadyThere = await BannedWord.findOne({
                    exception: false,
                    word: word
                })
                if (isAlreadyThere)
                    return await client.response.sendError(
                        message,
                        `This word is already banned!`
                    )

                console.log(duration)
                await BannedWord.createBannedWord(
                    {
                        word: word,
                        punishment_type: punishment as "BAN" | "MUTE" | "WARN",
                        reason: reason,
                        duration: duration,
                        exception: false
                    },
                    client
                )

                return await client.response.sendSuccess(message, `Added the word!`)
            }
            if (subcommand === "remove") {
                const word = args.consume("word")
                if (!word)
                    return await client.response.sendError(
                        message,
                        `Please specify a word.`
                    )
                const isThere = await BannedWord.findOne({
                    exception: false,
                    word: word
                })
                if (!isThere)
                    return client.response.sendError(
                        message,
                        `I can't unban a word that is not banned!`
                    )
                await isThere.deleteWord(client)
                return await client.response.sendSuccess(
                    message,
                    `The word has been deleted!`
                )
            }
        }
    }
})
