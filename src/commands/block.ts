import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import Discord from "discord.js"
import Args from "../struct/Args"
import mcBlockInfo from "minecraft-block-info"
import hexToRGB from "../util/hexToRGB"

export default new Command({
    name: "block",
    aliases: ["blocks", "material", "mcblock"],
    description: "Find a minecraft block! (currently only 1.12.2)",
    permission: Roles.ANY,
    usage: "<block1,block2>",
    subcommands: [
        {
            name: "search",
            description: "Search for blocks based on query.",
            usage: "<query>"
        }
    ],
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        let blocks = args.consume()
        let results
        if (!blocks)
            return client.channel.sendError(message.channel, "No blocks were found")
        if (blocks === "search") {
            const query = args.consumeRest()
            if (!query)
                return client.channel.sendError(message.channel, "No query was specified")
            results = await mcBlockInfo.search(query)
        } else {
            blocks += " " + args.consumeRest()
            const blocksInput = blocks.trim().split(",")
            const newBlocks = []
            blocksInput.forEach(element => newBlocks.push(element.trim()))
            results = await mcBlockInfo.searchAbsolute(
                await mcBlockInfo.filterInvalid(newBlocks)
            )
        }
        if (results.length === 0 || !results.length) {
            return client.channel.sendError(
                message.channel,
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
        console.log(file)
        if (results.length === 0)
            client.channel.sendError(message.channel, "No results were found")
        else if (results.length === 1)
            message.channel.send({
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
            const resultsMessage = await message.channel.send({
                embeds: [page],
                components: [row]
            })
            const filter = (interaction: Discord.Interaction) => {
                return (
                    interaction.isButton() &&
                    [`${message.id}.back`, `${message.id}.forwards`].includes(
                        interaction.customId
                    )
                )
            }
            const buttons = resultsMessage.createMessageComponentCollector({
                filter: filter,
                componentType: "BUTTON"
            })
            buttons.on("collect", async interaction => {
                if (interaction.user.id !== message.author.id)
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

                await resultsMessage.edit({
                    embeds: [page]
                })
            })
        }
    }
})
