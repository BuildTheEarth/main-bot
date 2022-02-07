import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import CommandMessage from "../struct/CommandMessage"
import Roles from "../util/roles"
import iso6391 from "../struct/client/iso6391"
import hexToRGB from "../util/hexToRGB"

export default new Command({
    name: "placeholder",
    aliases: ["placeholders"],
    description: "List and manage placeholders.",
    permission: [Roles.MODERATOR, Roles.HELPER, Roles.MANAGER, Roles.PR_TRANSLATION_TEAM],
    subcommands: [
        {
            name: "list",
            description: "List all placeholders."
        },
        {
            name: "add",
            description: "Add a placeholder.",
            args: [
                {
                    name: "name",
                    description: "placeholder name.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "language",
                    description: "placeholder language.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "body",
                    description: "placeholder body.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "edit",
            description: "Edit a placeholder.",
            args: [
                {
                    name: "name",
                    description: "placeholder name.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "language",
                    description: "placeholder language.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "body",
                    description: "placeholder body.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a placeholder.",
            args: [
                {
                    name: "name",
                    description: "placeholder name.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "language",
                    description: "placeholder language.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "info",
            description: "Get info about a placeholder.",
            args: [
                {
                    name: "name",
                    description: "placeholder name.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "language",
                    description: "placeholder language.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf([
            "list",
            "add",
            "edit",
            "delete",
            "info"
        ])
        const name = args.consume("name").toLowerCase()
        if (name.length > 32)
            return client.response.sendError(message, client.messages.nameTooLong32)
        const language = args.consume("language").toLowerCase()
        const body = args.consumeRest(["body"])

        await message.continue()
        const placeholders = await client.placeholder.cache
        if (subcommand === "list" || !subcommand) {
            const tidy: Record<string, { languages: string[] }> = {}

            for (const placeholder of Object.values(placeholders)) {
                if (!tidy[placeholder.name])
                    tidy[placeholder.name] = {
                        languages: []
                    }
                tidy[placeholder.name].languages.push(placeholder.language)
            }

            const sortedPlaceholders = Object.entries(tidy)

            sortedPlaceholders.sort((a, b) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const [sort1, sort2]: any = [a[0], b[0]]
                if (sort1 < sort2) return -1
                if (sort1 > sort2) return 1
                return 0
            })

            const embed = {
                author: { name: "Placeholder list" },
                description: ""
            }
            for (const [name, { languages }] of sortedPlaceholders) {
                languages.sort()
                const onlyEnglish = languages.length === 1 && languages[0] === "en"
                const languageList = onlyEnglish ? "" : ` (${languages.join(", ")})`
                embed.description += `• \u200B \u200B ${name}${languageList}\n`
                    .split("_")
                    .join("\\_")
            }
            await client.response.sendSuccess(message, embed)
        } else if (subcommand === "add") {
            if (placeholders[name + " " + language])
                return client.response.sendError(
                    message,
                    client.messages.alreadyExistsPlaceholder
                )
            if (!body) return client.response.sendError(message, client.messages.noBody)
            if (!name)
                return client.response.sendError(
                    message,
                    client.messages.noPlaceholderName
                )
            if (!language)
                return client.response.sendError(message, client.messages.noLang)
            if (!iso6391.validate(language))
                return client.response.sendError(
                    message,
                    client.messages.invalidPlaceholderLang
                )
            if (name.match(/{+|}+/g))
                return client.response.sendError(
                    message,
                    client.messages.invalidPlaceholderName
                )
            await client.placeholder.addPlaceholder(name, language, body)
            await client.response.sendSuccess(
                message,
                `Added placeholder ${name} (${language})`
            )
            client.log(placeholders[name + " " + language], "add", message.member.user)
        } else if (subcommand === "edit") {
            if (!body) return client.response.sendError(message, client.messages.noBody)
            if (!name)
                return client.response.sendError(
                    message,
                    client.messages.noPlaceholderName
                )
            if (!language)
                return client.response.sendError(message, client.messages.noLang)
            if (!placeholders[name + " " + language])
                return client.response.sendError(
                    message,
                    client.messages.placeholderNotFound
                )
            await client.placeholder.editPlaceholder(name, language, body)
            await client.response.sendSuccess(
                message,
                `Edited placeholder ${name} (${language})`
            )
            client.log(placeholders[name + " " + language], "edit", message.member.user)
        } else if (subcommand === "delete") {
            if (!name)
                return client.response.sendError(
                    message,
                    client.messages.noPlaceholderName
                )
            if (!language)
                return client.response.sendError(message, client.messages.noLang)
            if (!placeholders[name + " " + language])
                return client.response.sendError(
                    message,
                    client.messages.placeholderNotFound
                )
            client.placeholder.deletePlaceholder(name, language)
            await client.response.sendSuccess(
                message,
                `Deleted placeholder ${name} (${language})`
            )
            client.log(placeholders[name + " " + language], "delete", message.member.user)
        } else if (subcommand === "info") {
            if (!name)
                return client.response.sendError(
                    message,
                    client.messages.noPlaceholderName
                )
            if (!language)
                return client.response.sendError(message, client.messages.noLang)
            if (!placeholders[name + " " + language])
                return client.response.sendError(
                    message,
                    client.messages.placeholderNotFound
                )
            const placeholder = placeholders[name + " " + language]
            const embed = {
                color: hexToRGB(client.config.colors.info),
                description:
                    `The **${placeholder.name}** placeholder responds with ` +
                    `the following text in ${iso6391.getName(placeholder.language)}:` +
                    `\n\`\`\`\n${placeholder.body}\`\`\``
            }
            await message.send({ embeds: [embed] })
        }
    }
})
