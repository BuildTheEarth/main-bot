import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Snippet from "../entities/Snippet.entity.js"

import languages from "../struct/client/iso6391.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage.js"
import { hexToRGB } from "@buildtheearth/bot-utils"

const subSnippetTypes = ["team", "rule"]

export default new Command({
    name: "snippets",
    aliases: [],
    description: "List and manage snippets.",
    permission: globalThis.client.roles.ANY,
    inheritGlobalArgs: true,
    args: [
        {
            name: "subsnippet",
            description: "The subsnippet type.",
            required: false,
            optionType: "STRING",
            choices: subSnippetTypes
        }
    ],
    subcommands: [
        {
            name: "list",
            description: "List all snippets.",
            permission: globalThis.client.roles.ANY,
            args: [
                {
                    name: "date",
                    description: "To use the date sorting mode or not",
                    required: false,
                    optionType: "STRING",
                    choices: ["date"]
                }
            ]
        },
        {
            name: "add",
            description: "Add a snippet.",
            permission: [
                globalThis.client.roles.SUPPORT,
                globalThis.client.roles.MANAGER,
                globalThis.client.roles.PR_TRANSLATION_TEAM
            ],
            args: [
                {
                    name: "name",
                    description: "Snippet name.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "language",
                    description: "Snippet language.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "body",
                    description: "Snippet body.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "edit",
            description: "Edit a snippet.",
            permission: [
                globalThis.client.roles.SUPPORT,
                globalThis.client.roles.MANAGER,
                globalThis.client.roles.PR_TRANSLATION_TEAM
            ],
            args: [
                {
                    name: "name",
                    description: "Snippet name.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "language",
                    description: "Snippet language.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "body",
                    description: "Snippet body.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a snippet.",
            permission: [
                globalThis.client.roles.SUPPORT,
                globalThis.client.roles.MANAGER
            ],
            args: [
                {
                    name: "name",
                    description: "Snippet name.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "language",
                    description: "Snippet language.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "source",
            description: "Get the source response of a specific snippet.",
            permission: globalThis.client.roles.ANY,
            args: [
                {
                    name: "name",
                    description: "Snippet name.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "language",
                    description: "Snippet language.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "aliases",
            description: " Add aliases to a snippet",
            permission: [
                globalThis.client.roles.SUPPORT,
                globalThis.client.roles.MANAGER
            ],
            group: true,
            subcommands: [
                {
                    name: "list",
                    description: "List all snippet aliases for a snippet.",
                    permission: globalThis.client.roles.ANY,
                    args: [
                        {
                            name: "name",
                            description: "Snippet name.",
                            required: true,
                            optionType: "STRING"
                        },
                        {
                            name: "language",
                            description: "Snippet language.",
                            required: true,
                            optionType: "STRING"
                        }
                    ]
                },
                {
                    name: "add",
                    description: "Add a snippet alias.",
                    permission: [
                        globalThis.client.roles.SUPPORT,
                        globalThis.client.roles.MANAGER
                    ],
                    args: [
                        {
                            name: "name",
                            description: "Snippet name.",
                            required: true,
                            optionType: "STRING"
                        },
                        {
                            name: "language",
                            description: "Snippet language.",
                            required: true,
                            optionType: "STRING"
                        },
                        {
                            name: "alias",
                            description: "Snippet alias.",
                            required: true,
                            optionType: "STRING"
                        }
                    ]
                },
                {
                    name: "delete",
                    description: "Deletes a snippet alias.",
                    permission: [
                        globalThis.client.roles.SUPPORT,
                        globalThis.client.roles.MANAGER
                    ],
                    args: [
                        {
                            name: "name",
                            description: "Snippet name.",
                            required: true,
                            optionType: "STRING"
                        },
                        {
                            name: "language",
                            description: "Snippet language.",
                            required: true,
                            optionType: "STRING"
                        },
                        {
                            name: "alias",
                            description: "Snippet alias.",
                            required: true,
                            optionType: "STRING"
                        }
                    ]
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const rules = !!args.consumeIf(["rule", "rules"], "subsnippet")

        const teams = !!args.consumeIf(["team", "teams"], "subsnippet")

        const currType = (rules ? "rule" : teams ? "team" : "snippet") as
            | "snippet"
            | "rule"
            | "team"

        let subcommand = args.consumeSubcommandIf([
            "list",
            "add",
            "edit",
            "delete",
            "source"
        ])
        let subcommandGroup = args.consumeSubcommandGroupIf(["aliases"])
        if (subcommand) subcommand = subcommand.toLowerCase()
        if (subcommandGroup) subcommandGroup = subcommandGroup.toLowerCase()

        if (
            (subcommand === "list" && !subcommandGroup) ||
            (!subcommand && !(subcommandGroup === "aliases"))
        ) {
            await message.continue()

            const sortMode = args.consume("date").toLowerCase()
            const snippets = await Snippet.find()
            const tidy: Record<
                string,
                { aliases: string[]; languages: string[]; type: string }
            > = {}

            for (const snippet of snippets) {
                if (snippet.type == currType) {
                    if (!tidy[snippet.name])
                        tidy[snippet.name] = {
                            aliases: [],
                            languages: [],
                            type: snippet.type
                        }

                    if (snippet.aliases)
                        tidy[snippet.name].aliases.push(...snippet.aliases)
                    tidy[snippet.name].languages.push(snippet.language)
                }
            }

            const sortedSnippets = Object.entries(tidy)

            if (sortMode.toLowerCase() != "date") {
                sortedSnippets.sort((a, b) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let [sort1, sort2]: any = [a[0], b[0]]
                    if (currType === "rule") [sort1, sort2] = [Number(a[0]), Number(b[0])]
                    if (sort1 < sort2) return -1
                    if (sort1 > sort2) return 1
                    return 0
                })
            }

            const snippetEmbeds = [
                {
                    color: hexToRGB("#1EAD2F"),
                    author: { name: "Snippet list" },
                    description: ""
                }
            ]
            let currentEmbed = 0
            for (const [name, { aliases, languages, type }] of sortedSnippets) {
                if (type == currType) {
                    languages.sort()
                    const triggers = [name, ...aliases].join(" / ")
                    const onlyEnglish = languages.length === 1 && languages[0] === "en"
                    const languageList = onlyEnglish ? "" : ` (${languages.join(", ")})`
                    if (
                        [
                            ...(
                                snippetEmbeds[currentEmbed].description +
                                `• \u200B \u200B ${triggers}${languageList}\n`
                            )
                                .split("_")
                                .join("\\_")
                        ].length > 4096
                    ) {
                        currentEmbed += 1
                        snippetEmbeds.push({
                            color: hexToRGB("#1EAD2F"),
                            author: { name: `Snippet list pt. ${currentEmbed + 1}` },
                            description: ""
                        })
                    }
                    snippetEmbeds[currentEmbed].description +=
                        `• \u200B \u200B ${triggers}${languageList}\n`
                            .split("_")
                            .join("\\_")
                }
            }
            if (snippetEmbeds.length <= 1) return message.send({ embeds: snippetEmbeds })
            let row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton()
                    .setCustomId(`${message.id}.forwards`)
                    .setLabel(client.config.emojis.right.toString())
                    .setStyle("SUCCESS")
            )
            const sentMessage = await message.send({
                embeds: [snippetEmbeds[0]],
                components: [row]
            })

            let page = 1
            let old = 1

            const interactionFunc = async interaction => {
                if (
                    !(
                        interaction.isButton() &&
                        [`${message.id}.back`, `${message.id}.forwards`].includes(
                            interaction.customId
                        )
                    )
                )
                    return
                if (interaction.user.id !== message.member.id)
                    return interaction.reply({
                        content: message.messages.wrongUser,
                        ephemeral: true
                    })
                if (
                    (interaction as Discord.ButtonInteraction).customId ===
                    `${message.id}.forwards`
                )
                    page += 1
                if (
                    (interaction as Discord.ButtonInteraction).customId ===
                    `${message.id}.back`
                )
                    page -= 1
                if (page === 1) {
                    row = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageButton()
                            .setCustomId(`${message.id}.forwards`)
                            .setLabel(client.config.emojis.right.toString())
                            .setStyle("SUCCESS")
                    )
                } else if (page === snippetEmbeds.length) {
                    row = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageButton()
                            .setCustomId(`${message.id}.back`)
                            .setLabel(client.config.emojis.left.toString())
                            .setStyle("SUCCESS")
                    )
                } else {
                    row = new Discord.MessageActionRow()

                        .addComponents(
                            new Discord.MessageButton()
                                .setCustomId(`${message.id}.back`)
                                .setLabel(client.config.emojis.left.toString())
                                .setStyle("SUCCESS")
                        )
                        .addComponents(
                            new Discord.MessageButton()
                                .setCustomId(`${message.id}.forwards`)
                                .setLabel(client.config.emojis.right.toString())
                                .setStyle("SUCCESS")
                        )
                }

                if (old === page) return
                old = page

                const embed = snippetEmbeds[page - 1]
                await (interaction as Discord.ButtonInteraction).update({
                    components: [row]
                })
                if (interaction.message instanceof Discord.Message) {
                    try {
                        await interaction.message.edit({ embeds: [embed] })
                    } catch {
                        interaction.editReply({ embeds: [embed] })
                    }
                } else interaction.editReply({ embeds: [embed] })
            }

            client.on("interactionCreate", interactionFunc)

            setTimeout(async () => {
                await sentMessage.edit({ content: "Expired", components: [] })
                client.off("interactionCreate", interactionFunc)
            }, 600000)
        } else if (subcommandGroup === "aliases") {
            // eslint-disable-next-line prefer-const
            let subcommand = args.consumeSubcommand()

            if (rules) {
                return client.response.sendError(message, message.messages.ruleAlias)
            }

            // eslint-disable-next-line prefer-const
            let [name, language] = [args.consume("name"), args.consume("language")]
            const editPermissions = [
                globalThis.client.roles.SUPPORT,
                globalThis.client.roles.MANAGER,
                globalThis.client.roles.PR_TRANSLATION_TEAM
            ]
            if (
                !GuildMember.hasRole(message.member, editPermissions, client) &&
                !(subcommand === "list")
            )
                return client.response.sendError(message, message.messages.noPermission)
            const languageName = languages.getName(language)
            if (!name)
                return client.response.sendError(message, message.messages.noSnippet)
            if (!languageName && !teams)
                return client.response.sendError(
                    message,
                    message.messages.invalidSnippetLang
                )
            if (languageName && teams) language = "en"
            if (!languageName && teams) language = "en"

            await message.continue()

            const snippet = await Snippet.findOne({ name, language })
            if (!snippet)
                return client.response.sendError(
                    message,
                    message.messages.snippetNotFound
                )
            if (subcommand === "list") {
                const list =
                    snippet.aliases.map(alias => `• \u200B \u200B ${alias}`).join("\n") ||
                    "*No aliases.*"
                return client.response.sendSuccess(message, list)
            }

            const alias = teams
                ? args.consumeRest(["alias"]).toLowerCase()
                : args.consume("alias").toLowerCase()
            if (!alias)
                return client.response.sendError(message, message.messages.noAlias)
            if (subcommand === "add") {
                if (!snippet.aliases) snippet.aliases = []
                snippet.aliases.push(alias)
                await snippet.save()
                return client.response.sendSuccess(
                    message,
                    `Added alias **${alias}** to **${name}** ${currType} in ${languageName}.`
                )
            } else if (subcommand === "delete") {
                if (!snippet.aliases.includes(alias))
                    return client.response.sendError(
                        message,
                        "That snippet does not have this alias!"
                    )

                snippet.aliases.splice(snippet.aliases.indexOf(alias), 1)
                await snippet.save()
                return client.response.sendSuccess(
                    message,
                    `Removed the **${alias}** alias from **${name}** ${currType} in ${languageName}.`
                )
            }
        }
        const editPermissions = [
            globalThis.client.roles.SUPPORT,
            globalThis.client.roles.MANAGER,
            globalThis.client.roles.PR_TRANSLATION_TEAM
        ]
        const deletePermissions = [
            globalThis.client.roles.SUPPORT,
            globalThis.client.roles.MANAGER
        ]
        if (
            !GuildMember.hasRole(message.member, editPermissions, client) &&
            subcommand !== "source"
        )
            return
        const canDelete = GuildMember.hasRole(message.member, deletePermissions, client)
        if (subcommand === "delete" && !canDelete) return

        const name = args.consume("name").toLowerCase()
        let language = args.consume("language").toLowerCase()
        const languageName = languages.getName(language)
        if (!name) return client.response.sendError(message, message.messages.noName)
        if (!languageName && !teams)
            return client.response.sendError(message, message.messages.invalidSnippetLang)
        if (languageName && teams) language = "en"
        if (!languageName && teams) language = "en"

        await message.continue()

        const existingSnippet = await Snippet.findOne({
            name: name,
            language: language,
            type: currType
        })

        if (
            (subcommand === "add" && !subcommandGroup) ||
            (subcommand === "edit" && !subcommandGroup)
        ) {
            const body = args.consumeRest(["body"])
            let snippet: Snippet
            if (!body) return client.response.sendError(message, message.messages.noBody)

            if (subcommand === "add") {
                if (client.commands.search(name))
                    return client.response.sendError(
                        message,
                        message.messages.alreadyInUse
                    )
                if (existingSnippet)
                    return client.response.sendError(
                        message,
                        message.messages.alreadyExists
                    )
                if (rules) {
                    if (Number.isNaN(Number(name))) {
                        return client.response.sendError(
                            message,
                            message.messages.invalidRuleName
                        )
                    }
                }
                snippet = new Snippet()
                snippet.name = name
                snippet.language = language
                snippet.aliases = []
                snippet.type = currType
            } else if (subcommand === "edit") {
                if (!existingSnippet)
                    return client.response.sendError(
                        message,
                        "That snippet doesn't exist!"
                    )
                if (existingSnippet.body === body)
                    return client.response.sendError(message, message.messages.noChange)
                snippet = existingSnippet
            }

            snippet.body = body
            await snippet.save()
            const past = subcommand === "add" ? "Added" : "Edited"
            // prettier-ignore
            await client.response.sendSuccess(message, `${past} **${name}** ${currType} in ${languageName}.`)
            await client.log(snippet, subcommand, message.member.user)
        } else if (subcommand === "delete" && !subcommandGroup) {
            if (!existingSnippet)
                return client.response.sendError(
                    message,
                    message.messages.snippetNotFound
                )

            await existingSnippet.remove()
            // prettier-ignore
            await client.response.sendSuccess(message, `Deleted **${name}** ${currType} in ${languageName}.`)
            await client.log(existingSnippet, "delete", message.member.user)
        } else if (subcommand === "source" && !subcommandGroup) {
            if (!existingSnippet)
                return client.response.sendError(
                    message,
                    message.messages.snippetNotFound
                )
            await message.send({
                embeds: [
                    {
                        color: hexToRGB(client.config.colors.info),
                        description:
                            `The **${existingSnippet.name}** ${currType} responds with ` +
                            `the following text in ${languageName}:` +
                            `\n\`\`\`\n${existingSnippet.body}\`\`\``
                    }
                ]
            })
        }
    }
})
