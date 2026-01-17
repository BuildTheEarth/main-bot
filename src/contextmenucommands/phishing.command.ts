import { ApplicationCommandType, GuildMember, MessageFlags } from "discord.js";
import { ContextMenuCommand } from "../struct/client/ContextMenuCommandList.js";
import CommandMessage from "../struct/CommandMessage.js";
import { hexToNum, noop } from "@buildtheearth/bot-utils";
import BotGuildMember from "../struct/discord/BotGuildMember.js";
import punish from "../util/punish.util.js";
import { vsprintf } from "sprintf-js";

export default new ContextMenuCommand({
    name: "Kick for Phishing",
    type: ApplicationCommandType.Message,
    permissions: [
        globalThis.client.roles.MODERATOR,
        globalThis.client.roles.MANAGER
    ],
    async run(client, interaction) {
        if (!interaction.isMessageContextMenuCommand()) return

        const realMessage = interaction.options.getMessage("message", true)
        const user = realMessage.author

        if (!user)
            return interaction.reply({
                content: client.messages.getMessage(
                    "noUser",
                    interaction.locale
                ),
                flags: [MessageFlags.Ephemeral]
            })

        await realMessage.fetch(true)

        const member: GuildMember | null = await realMessage.guild!.members
            .fetch({ user, cache: false })
            .catch(noop)    

        if (!member) return interaction.reply({ content: client.messages.getMessage("notInGuild", interaction.locale), flags: [MessageFlags.Ephemeral] })

        if (member.user.bot) return interaction.reply({ content: client.messages.getMessage("isBot", interaction.locale), flags: [MessageFlags.Ephemeral] })
        if (member.id === interaction.user.id)
            return interaction.reply({ content: client.messages.getMessage("isSelfKick", interaction.locale), flags: [MessageFlags.Ephemeral] })
        if (BotGuildMember.hasRole(member, globalThis.client.roles.STAFF, client))
            return interaction.reply({ content: client.messages.getMessage("isStaffKick", interaction.locale), flags: [MessageFlags.Ephemeral] })

        const reason = client.placeholder.replacePlaceholders("{{phishing}}")

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] })

        const length = null
        const log = await punish(client, interaction, user, "kick", reason, null, length)

        await interaction.followUp({ content: vsprintf(client.messages.getMessage("kickedUser", interaction.locale), [user, log.id]), flags: [MessageFlags.Ephemeral] })

        await client.log(log)

        await realMessage.delete().catch(noop)

        await client.customGuilds.main().channels.fetch().then(channels => {
            const modChat = channels.find(ch => ch?.name === "mod-chat")
            if (modChat?.isTextBased()) {
                modChat.send({
                    embeds: [
                        {
                            color: hexToNum(client.config.colors.success),
                            description: vsprintf(client.messages.getMessage("phishingKickLog", interaction.locale), [user, log.id, interaction.user])
                        }
                    ]
                }).catch(noop)
            }
        }).catch(noop)

    }
});