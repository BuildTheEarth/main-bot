import { noop } from "@buildtheearth/bot-utils"
import BotClient from "../struct/BotClient.js"
import BlockPage from "../struct/client/BlockPage.js"
import { ComponentHandler } from "../struct/client/ComponentHandlersList.js"
import { InteractionType, Interaction, MessageFlags } from "discord.js"

export default new ComponentHandler({
    name: "BlockMenu",
    prefix: "blockPage|",
    passTypes: [InteractionType.MessageComponent],
    async run(client: BotClient, interaction: Interaction) {
        if (interaction.type != InteractionType.MessageComponent) return

        if (!interaction.isButton()) return

        const blockPage = BlockPage.fromCustomId(client, interaction.customId)

        if (interaction.user.id != blockPage.userID) {
            return await interaction
                .reply({
                    content: "Sorry, but you did not create this menu!",
                    flags: MessageFlags.Ephemeral
                })
                .catch(noop)
        }

        if (blockPage.pendingAction == "NEXT") {
            const retVal = blockPage.nextPage()
            if (!retVal) {
                return await interaction
                    .reply({
                        content: "Hey there! Enough pages for you!",
                        flags: MessageFlags.Ephemeral
                    })
                    .catch(noop)
            }
        } else if (blockPage.pendingAction == "PREVIOUS") {
            const retVal = blockPage.previousPage()
            if (!retVal) {
                return await interaction
                    .reply({
                        content: "Hey there! Enough pages for you!",
                        flags: MessageFlags.Ephemeral
                    })
                    .catch(noop)
            }
        }

        if (interaction.message.editable) {
            await interaction
                .update({
                    fetchReply: true,
                    components: blockPage.getButtons(),
                    embeds: blockPage.getEmbeds(interaction.user.tag)
                })
                .catch(noop)
        } else {
            await interaction.reply({
                content: "Sorry, but you cannot use this menu anymore!",
                flags: MessageFlags.Ephemeral
            })
        }
    }
})
