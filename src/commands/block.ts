import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import Discord from "discord.js"
import Args from "../struct/Args"
import mcBlockInfo from "minecraft-block-info"
import hexToRGB from "../util/hexToRGB"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "block",
    aliases: ["blocks", "material", "mcblock"],
    description: "Find a minecraft block! (currently only 1.12.2)",
    permission: Roles.ANY,
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
        let results //TODO: Fix this huge mess
        if (subcommand === "search") {
            const query = args.consumeRest(["query"])
            if (!query)
                return client.response.sendError(message, "No query was specified")
            results = await mcBlockInfo.search(query)
        }
        if (subcommand === "absolute" || !subcommand) {
            const blocks = args.consumeRest(["blocks"])
            if (!blocks) return client.response.sendError(message, "No blocks were found")
            const blocksInput = blocks.trim().split(",")
            const newBlocks = []
            blocksInput.forEach(element => newBlocks.push(element.trim()))
            results = await mcBlockInfo.searchAbsolute(
                await mcBlockInfo.filterInvalid(newBlocks)
            )
        }
        if (results.length === 0 || !results.length) {
            return client.response.sendError(
                message,
                "Your search did not match any results\nSuggestions:\n• Make sure all words are spelled correctly.\n• Try different keywords.\n• Try more general keywords."
            )
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
        if (results.length === 0)
            client.response.sendError(message, "No results were found")
        else if (results.length === 1)
            message.send({
                embeds: [
                    new Discord.MessageEmbed()
                        .setTitle("Results")
                        .setImage(file)
                        .setColor(hexToRGB(client.config.colors.info))
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
            let page = new Discord.MessageEmbed()
                .setTitle(`Page ${pageNum + 1}`)
                .setImage(file)
                .setFooter(`Page ${pageNum + 1}/${results.length}`)
            await message.send({
                embeds: [page],
                components: [row]
            })
            client.on("interactionCreate", async interaction => {
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
                    page = new Discord.MessageEmbed()
                        .setTitle(`Page ${pageNum + 1}`)
                        .setImage(file)
                        .setFooter(`Page ${pageNum + 1}/${results.length}`)
                        .setColor(hexToRGB(client.config.colors.info))
                } else {
                    page = new Discord.MessageEmbed()
                        .setTitle(`Page ${pageNum + 1}`)
                        .setImage(
                            client.webserver.getURLfromPath(
                                `${message.id}/image${pageNum}.png`
                            )
                        )
                        .setFooter(`Page ${pageNum + 1}/${results.length}`)
                        .setColor(hexToRGB(client.config.colors.info))
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
            })
        }
    }
})
