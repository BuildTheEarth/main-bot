import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import Discord from "discord.js"
import Args from "../struct/Args.js"
import mcBlockInfo from "minecraft-block-info"
import CommandMessage from "../struct/CommandMessage.js"
import { hexToRGB } from "@buildtheearth/bot-utils"

export default new Command({
    name: "block",
    aliases: [],
    description: "Find a minecraft block! (currently only 1.12.2)",
    permission: globalThis.client.roles.ANY,
    basesubcommand: "block",
    args: [
        {
            name: "blocks",
            description: "blocks to search seperated by ,",
            required: true,
            optionType: "STRING"
        }
    ],
    subcommands: [
        {
            name: "search",
            description: "Search for blocks based on query.",
            args: [
                {
                    name: "query",
                    description: "Query to search by.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(["block", "search"])
        let results: any[] = [] //TODO: Fix this huge mess
        if (subcommand === "search") {
            const query = args.consumeRest(["query"])
            if (!query) return message.sendErrorMessage("noQuery")

            await message.continue()

            results = await mcBlockInfo.search(query)
        }
        if (subcommand === "absolute" || !subcommand) {
            const blocks = args.consumeRest(["blocks"])
            if (!blocks) return message.sendErrorMessage("noBlocksFound")
            const blocksInput = blocks.trim().split(",")
            const newBlocks: any[] = []
            blocksInput.forEach(element => newBlocks.push(element.trim()))

            await message.continue()

            results = await mcBlockInfo.searchAbsolute(
                await mcBlockInfo.filterInvalid(newBlocks)
            )
        }
        if (results.length === 0 || !results.length) {
            return message.sendErrorMessage("googleRipOff")
        }
        results = results.reduce((all, one, i) => {
            const ch = Math.floor(i / 5)
            all[ch] = [].concat(all[ch] || [], one)
            return all
        }, [])
        let buffIMG = Buffer.from(
            (await mcBlockInfo.getBlockImageObject(results[0])).split(",")[1],
            "base64"
        )
        let file = await client.webserver.addImage(buffIMG, `${message.id}/image0.png`)
        if (results.length === 0) message.sendErrorMessage("noResultsFound")
        else if (results.length === 1)
            message.send({
                embeds: [
                    {
                        title: "Results",
                        image: {
                            url: file
                        },
                        color: hexToRGB(client.config.colors.info)
                    }
                ]
            })
        else {
            let pageNum = 0
            let row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton()
                    .setCustomId(`${message.id}.forwards`)
                    .setLabel(client.config.emojis.right.toString())
                    .setStyle("SUCCESS")
            )
            let page : Discord.MessageEmbedOptions = {
                title: `Page ${pageNum + 1}`,
                image: {
                    url: file
                },
                footer: { text: `Page ${pageNum + 1}/${results.length}` }
            }
            const sentMessage = await message.send({
                embeds: [page],
                components: [row]
            })

            const interactionFunc = async (interaction: Discord.Interaction) => {
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
                        content: `Did you summon that menu?, I think not!`,
                        ephemeral: true
                    })
                if (
                    (interaction as Discord.ButtonInteraction).customId ===
                    `${message.id}.forwards`
                )
                    pageNum += 1
                if (
                    (interaction as Discord.ButtonInteraction).customId ===
                    `${message.id}.back`
                )
                    pageNum -= 1
                if (pageNum === 0) {
                    row = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageButton()
                            .setCustomId(`${message.id}.forwards`)
                            .setLabel(client.config.emojis.right.toString())
                            .setStyle("SUCCESS")
                    )
                } else if (pageNum === results.length - 1) {
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
                if (
                    !(await client.webserver.imageExists(
                        `${message.id}/image${pageNum}.png`
                    ))
                ) {
                    buffIMG = Buffer.from(
                        (await mcBlockInfo.getBlockImageObject(results[pageNum])).split(
                            ","
                        )[1],
                        "base64"
                    )
                    file = await client.webserver.addImage(
                        buffIMG,
                        `${message.id}/image${pageNum}.png`
                    )
                    page = {
                        title: `Page ${pageNum + 1}`,
                        image: {
                            url: file
                        },
                        footer: { text: `Page ${pageNum + 1}/${results.length}` },
                        color: hexToRGB(client.config.colors.info)
                    }
                } else {
                    page = {
                        title: `Page ${pageNum + 1}`,
                        image: {
                            url: client.webserver.getURLfromPath(
                                `${message.id}/image${pageNum}.png`
                            )
                        },
                        footer: { text: `Page ${pageNum + 1}/${results.length}` },
                        color: hexToRGB(client.config.colors.info)
                    }
                }
                await (interaction as Discord.ButtonInteraction).update({
                    components: [row]
                })
                if (interaction.message instanceof Discord.Message) {
                    try {
                        await interaction.message.edit({ embeds: [page] })
                    } catch {
                        interaction.editReply({ embeds: [page] })
                    }
                } else interaction.editReply({ embeds: [page] })
            }

            client.on("interactionCreate", interactionFunc)

            setTimeout(async () => {
                await sentMessage.edit({ content: "Expired", components: [] })
                client.off("interactionCreate", interactionFunc)
            }, 600000)
        }
    }
})
