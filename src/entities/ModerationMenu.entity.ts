import {
    Message,
    EmbedBuilder,
    EmbedField,
    escapeMarkdown,
    SelectMenuComponentOptionData,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextChannel,
    StringSelectMenuInteraction,
    ButtonInteraction,
    Interaction,
    GuildMember,
    MessageFlags
} from "discord.js"
import _ from "lodash"
import path from "path"
import url from "url"
import typeorm from "typeorm"
import unicode from "./transformers/unicode.transformer.js"
import {
    formatPunishmentTime,
    hexToRGB,
    loadSyncJSON5,
    truncateString
} from "@buildtheearth/bot-utils"
const punishmentValues = loadSyncJSON5(
    path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            "../../../config/extensions/punishmentValues.json5"
    )
)
import BotClient from "../struct/BotClient.js"
import { BannedWordObj } from "../struct/client/BannedWordFilter.js"
import { bannedWordsOptions } from "./BannedWord.entity.js"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn.decorator.js"
import JSON5 from "json5"
import punish from "../util/punish.util.js"
import { noop } from "@buildtheearth/bot-utils"
import TimedPunishment from "./TimedPunishment.entity.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"

function getDuration(duration: number): string {
    if (duration === null) return "Indefinite"
    return formatPunishmentTime(duration, true)
}

@typeorm.Entity({ name: "moderation_menus" })
export default class ModerationMenu extends typeorm.BaseEntity {
    public static async createMenu(
        message: Message,
        filterResponse: BannedWordObj[],
        client: BotClient
    ): Promise<ModerationMenu | undefined> {
        if (!message.member) return
        if (
            BotGuildMember.hasRole(
                message.member,
                [
                    globalThis.client.roles.HELPER,
                    globalThis.client.roles.MODERATOR,
                    globalThis.client.roles.MANAGER
                ],
                client
            )
        )
            return

        await message.delete().catch(noop)

        if (message.channel.isSendable()) {
            const tempMessage = await message.channel
                .send(`<@${message.author.id}>, your message contained blocked words!`)
                .catch(noop)

            setTimeout(async () => await tempMessage?.delete()?.catch(noop), 1500)
        }

        let truePunishments = getMostSevereList(filterResponse, client)

        const existingMenu = await ModerationMenu.findOne({ member: message.author.id })

        if (existingMenu) {
            existingMenu.offenses += 1
            let truePunishments = getMostSevereList(filterResponse, client)
            truePunishments = truePunishments.filter(
                word => word.punishment_type !== "DELETE"
            )
            existingMenu.punishments.push(...truePunishments)
            existingMenu.punishments = _.uniqBy(existingMenu.punishments, "word")
            if (existingMenu.punishments[0].word)
                existingMenu.current_word = existingMenu.punishments[0].word
            existingMenu.save()

            const embed = new EmbedBuilder()
                .addFields(<EmbedField[]>[
                    {
                        name: "User",
                        value: `<@${existingMenu.member}> (${existingMenu.member})`
                    },
                    {
                        name: "Message",
                        value: truncateString(
                            existingMenu.message_text,
                            1024,
                            " (Check logs for the remaining content)"
                        )
                    },
                    { name: "Offenses", value: existingMenu.offenses.toString() },
                    {
                        name: "Punishment",
                        value: existingMenu.punishments[0].punishment_type
                    },
                    {
                        name: "Duration",
                        value: getDuration(
                            existingMenu.punishments[0].duration
                                ? existingMenu.punishments[0].duration
                                : 0
                        )
                    },
                    { name: "Reason", value: existingMenu.punishments[0].reason },
                    {
                        name: "Trigger",
                        value: escapeMarkdown(existingMenu.punishments[0].word ?? "", {
                            maskedLink: true
                        })
                    }
                ])
                .setColor(hexToRGB(client.config.colors.error))

            const punishmentOptions = existingMenu.punishments.map(punishment => {
                const punish = {
                    label:
                        truncateString(
                            punishment.reason ? punishment.reason : "",
                            15
                        ).trim().length <= 0
                            ? "No reason"
                            : truncateString(
                                  punishment.reason ? punishment.reason : "",
                                  15
                              ),
                    description: `${punishment.punishment_type} for ${getDuration(
                        punishment.duration ? punishment.duration : 0
                    )}, Word is ${punishment.word}`,
                    value: punishment.word,
                    default: false
                } as SelectMenuComponentOptionData
                return punish
            })

            const row = [
                new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`modmenu.${existingMenu.member}.menu`)
                        .setMinValues(1)
                        .setMaxValues(1)
                        .addOptions(punishmentOptions)
                        .setPlaceholder("Select a punishment")
                ),
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`modmenu.${existingMenu.member}.punish`)
                        .setStyle(ButtonStyle.Danger)
                        .setLabel("Punish"),
                    new ButtonBuilder()
                        .setCustomId(`modmenu.${existingMenu.member}.pardon`)
                        .setStyle(ButtonStyle.Success)
                        .setLabel("Pardon")
                )
            ]

            const channel = (await client.channels.fetch(
                client.config.logging.modLogs
            )) as TextChannel

            const modMenuMessage = await channel.messages.fetch({
                message: existingMenu.message,
                force: true
            })
            if (modMenuMessage) {
                await modMenuMessage.edit({ embeds: [embed], components: row })
            }

            return existingMenu
        }

        if (truePunishments[0].punishment_type === "DELETE") {
            const embed = new EmbedBuilder()
                .addFields(<EmbedField[]>[
                    {
                        name: "User",
                        value: `<@${message.author.id}> (${message.author.id})`
                    },
                    {
                        name: "Message",
                        value: truncateString(
                            message.content,
                            1024,
                            " (Check logs for the remaining content)"
                        )
                    },
                    {
                        name: "Trigger",
                        value: escapeMarkdown(truePunishments[0].word ?? "", {
                            maskedLink: true
                        })
                    }
                ])
                .setColor(hexToRGB(client.config.colors.error))

            const channel = (await client.channels.fetch(
                client.config.logging.modLogs
            )) as TextChannel
            await channel.send({
                content: `<@&${globalThis.client.roles.MODERATOR_ON_DUTY[0]}>`,
                embeds: [embed]
            })

            return
        }

        truePunishments = truePunishments.filter(
            word => word.punishment_type !== "DELETE"
        )

        const modMenu = new ModerationMenu()
        modMenu.member = message.author.id
        modMenu.message_text = message.content
        modMenu.punishments = _.uniqBy(truePunishments, "word")
        modMenu.offenses = 1
        if (modMenu.punishments[0].word)
            modMenu.current_word = modMenu.punishments[0].word

        const embed = new EmbedBuilder()
            .addFields(<EmbedField[]>[
                { name: "User", value: `<@${modMenu.member}> (${modMenu.member})` },
                {
                    name: "Message",
                    value: truncateString(
                        modMenu.message_text,
                        1024,
                        " (Check logs for the remaining content)"
                    )
                },
                { name: "Offenses", value: modMenu.offenses.toString() },
                { name: "Punishment", value: modMenu.punishments[0].punishment_type },
                {
                    name: "Duration",
                    value: getDuration(
                        modMenu.punishments[0].duration
                            ? modMenu.punishments[0].duration
                            : 0
                    )
                },
                { name: "Reason", value: modMenu.punishments[0].reason },
                {
                    name: "Trigger",
                    value: escapeMarkdown(modMenu.punishments[0].word ?? "", {
                        maskedLink: true
                    })
                }
            ])
            .setColor(hexToRGB(client.config.colors.error))

        const punishmentOptions = modMenu.punishments.map(punishment => {
            const punish = {
                label: truncateString(punishment.reason ? punishment.reason : "", 15),
                description: `${punishment.punishment_type} for ${getDuration(
                    punishment.duration ? punishment.duration : 0
                )}, Word is ${punishment.word}`,
                value: punishment.word,
                default: false
            } as SelectMenuComponentOptionData
            return punish
        })

        const row = [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`modmenu.${modMenu.member}.menu`)
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(punishmentOptions)
                    .setPlaceholder("Select a punishment")
            ),
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`modmenu.${modMenu.member}.punish`)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Punish"),
                new ButtonBuilder()
                    .setCustomId(`modmenu.${modMenu.member}.pardon`)
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Pardon")
            )
        ]

        //TODO: FINISH THIS
        const channel = (await client.channels.fetch(
            client.config.logging.modLogs
        )) as TextChannel

        modMenu.message = (
            await channel.send({
                content: `<@&${globalThis.client.roles.MODERATOR_ON_DUTY[0]}>`,
                embeds: [embed],
                components: row
            })
        ).id

        modMenu.save()

        return modMenu
    }

    public static async updateMenu(
        id: string,
        interaction: StringSelectMenuInteraction,
        client: BotClient
    ): Promise<ModerationMenu | null> {
        const modMenu = await ModerationMenu.findOne({ member: id })

        if (!modMenu) return null

        const punishment = modMenu.punishments.find(
            punishment => punishment.word === interaction.values[0]
        )

        if (!punishment) return null

        const embed = new EmbedBuilder()
            .addFields(<EmbedField[]>[
                { name: "User", value: `<@${modMenu.member}> (${modMenu.member})` },
                {
                    name: "Message",
                    value: truncateString(
                        modMenu.message_text,
                        1024,
                        " (Check logs for the remaining content)"
                    )
                },
                { name: "Offenses", value: modMenu.offenses.toString() },
                { name: "Punishment", value: punishment.punishment_type },
                {
                    name: "Duration",
                    value: getDuration(punishment.duration ? punishment.duration : 0)
                },
                { name: "Reason", value: punishment.reason },
                {
                    name: "Trigger",
                    value: escapeMarkdown(punishment.word ?? "", {
                        maskedLink: true
                    })
                }
            ])
            .setColor(hexToRGB(client.config.colors.error))

        interaction.editReply({ embeds: [embed] })
        modMenu.current_word = punishment.word ? punishment.word : ""
        await modMenu.save()
        return modMenu
    }
    public static async punishPerson(
        id: string,
        interaction: ButtonInteraction,
        client: BotClient,
        replyInteraction: ButtonInteraction
    ): Promise<void> {
        const messages = {
            alreadyPunished: "Invalid error message for context"
        }

        const modMenu = await ModerationMenu.findOne({ member: id })

        if (!modMenu) return

        const punishment: bannedWordsOptions | undefined = modMenu.punishments.find(
            punishment => punishment.word === modMenu.current_word
        )

        if (!punishment) return

        if (punishment.punishment_type === "BAN") {
            messages.alreadyPunished = client.messages.getMessage(
                "alreadyBanned",
                interaction.locale
            )
        }

        if (punishment.punishment_type === "MUTE") {
            messages.alreadyPunished = client.messages.getMessage(
                "alreadyMuted",
                interaction.locale
            )
        }

        const user = await client.users.fetch(modMenu.member)

        if (!user) {
            replyInteraction.editReply({
                content:
                    user === undefined
                        ? client.messages.getMessage("noUser", interaction.locale)
                        : client.messages.getMessage("invalidUser", interaction.locale)
            })

            return
        }

        if (!interaction.guild) return

        const member: GuildMember | null = await interaction.guild.members
            .fetch({ user, cache: false })
            .catch(noop)

        if (
            (!member && punishment.punishment_type === "KICK") ||
            (!member && punishment.punishment_type === "WARN")
        ) {
            await replyInteraction.editReply({
                content: client.messages.getMessage("notInGuild", interaction.locale)
            })
            return
        }

        if (user.bot) {
            await replyInteraction.editReply({
                content: client.messages.getMessage("isBot", interaction.locale)
            })
            return
        }

        if (user.id === interaction.user.id) {
            await replyInteraction.editReply({
                content: client.messages.getMessage("isSelfBan", interaction.locale)
            })
            return
        }

        if (member) {
            if (BotGuildMember.hasRole(member, globalThis.client.roles.STAFF, client)) {
                replyInteraction.editReply({
                    content: client.messages.getMessage("isStaffBan", interaction.locale)
                })
                return
            }
        }

        if (
            punishment.punishment_type === "MUTE" ||
            punishment.punishment_type === "BAN"
        ) {
            const punish = await TimedPunishment.findOne({
                member: user.id,
                type: punishment.punishment_type.toLowerCase() as "mute" | "ban"
            })
            if (punish) {
                await replyInteraction.editReply({
                    content: messages.alreadyPunished
                })
                return
            }
        }

        if (!punishment.punishment_type) return

        const log = await punish(
            client,
            interaction,
            user,
            punishment.punishment_type.toLowerCase() as "mute" | "ban" | "warn" | "kick",
            punishment.reason ? punishment.reason : "",
            null,
            punishment.duration ? punishment.duration : 0,
            modMenu.message
        )

        let formattedPunishment: string | null = null

        switch (punishment.punishment_type.toLowerCase()) {
            case "mute": {
                formattedPunishment = "Muted"
                break
            }

            case "ban": {
                formattedPunishment = "Banned"
                break
            }
            case "warn": {
                formattedPunishment = "Warned"
                break
            }
            case "kick": {
                formattedPunishment = "Kicked"
                break
            }
        }

        const formattedLength = formatPunishmentTime(
            punishment.duration ? punishment.duration : 0
        )
        await replyInteraction.editReply({
            content: `${formattedPunishment} ${user} ${formattedLength} (**#${log.id}**).`
        })
        await client.log(log)

        const embed = new EmbedBuilder()
            .addFields([
                { name: "User", value: `<@${modMenu.member}> (${modMenu.member})` },
                {
                    name: "Message",
                    value: truncateString(
                        modMenu.message_text,
                        1024,
                        " (Check logs for the remaining content)"
                    )
                },
                { name: "Offenses", value: modMenu.offenses.toString() },
                {
                    name: "Punished",
                    value: `This user has been punished by <@${interaction.user.id}> (${interaction.user.id}) at case **#${log.id}**`
                }
            ])
            .setColor(hexToRGB(client.config.colors.success))

        await (interaction.message as Message).edit({
            embeds: [embed],
            components: []
        })

        await modMenu.remove()
    }

    public static async pardon(
        id: string,
        interaction: ButtonInteraction,
        client: BotClient
    ): Promise<void> {
        const modMenu = await ModerationMenu.findOne({ member: id })

        if (!modMenu) return

        const embed = new EmbedBuilder()
            .addFields([
                { name: "User", value: `<@${modMenu.member}> (${modMenu.member})` },
                {
                    name: "Message",
                    value: truncateString(
                        modMenu.message_text,
                        1024,
                        " (Check logs for the remaining content)"
                    )
                },
                { name: "Offenses", value: modMenu.offenses.toString() },
                {
                    name: "Pardoned",
                    value: `This user has been pardoned by <@${interaction.user.id}> (${interaction.user.id})`
                }
            ])
            .setColor(hexToRGB(client.config.colors.success))

        await (interaction.message as Message).edit({
            content: `<@&${globalThis.client.roles.MODERATOR_ON_DUTY[0]}>`,
            embeds: [embed],
            components: []
        })

        await modMenu.remove()
    }

    public static async pardonConfirm(
        id: string,
        interaction: ButtonInteraction,
        client: BotClient
    ): Promise<void> {
        const components = [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`yes.${interaction.id}.modmenu`)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Pardon"),
                new ButtonBuilder()
                    .setCustomId(`no.${interaction.id}.modmenu`)
                    .setStyle(ButtonStyle.Success)
                    .setLabel("No")
            )
        ]
        const followMessage = await interaction.followUp({
            content: "Are you sure you want to pardon this user?",
            components: components,
            fetchReply: true,
            flags: MessageFlags.Ephemeral
        })

        const interactionFunc = async (interactionCurr: Interaction) => {
            if (
                !(
                    interactionCurr.isButton() &&
                    [
                        `yes.${interaction.id}.modmenu`,
                        `no.${interaction.id}.modmenu`
                    ].includes(interactionCurr.customId)
                )
            )
                return

            if (interactionCurr.customId === `yes.${interaction.id}.modmenu`) {
                await interactionCurr.update({
                    content: "Pardoned the user!",
                    components: []
                })

                await ModerationMenu.pardon(id, interaction, client)
            }
            if (interactionCurr.customId === `no.${interaction.id}.modmenu`) {
                await interactionCurr.update({
                    content: "Cancelled the pardon!",
                    components: []
                })
            }
        }

        client.on("interactionCreate", interactionFunc)

        setTimeout(async () => {
            await interaction.webhook.editMessage(followMessage.id, {
                content: "Expired",
                components: []
            })
            client.off("interactionCreate", interactionFunc)
        }, 300000)
    }

    public static async punishConfirm(
        id: string,
        interaction: ButtonInteraction,
        client: BotClient
    ): Promise<void> {
        const components = [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`yes.${interaction.id}.modmenu`)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Punish"),
                new ButtonBuilder()
                    .setCustomId(`no.${interaction.id}.modmenu`)
                    .setStyle(ButtonStyle.Success)
                    .setLabel("No")
            )
        ]
        const followMessage = await interaction.followUp({
            content: "Are you sure you want to punish this user?",
            components: components,
            flags: MessageFlags.Ephemeral
        })

        const interactionFunc = async (interactionCurr: Interaction) => {
            if (
                !(
                    interactionCurr.isButton() &&
                    [
                        `yes.${interaction.id}.modmenu`,
                        `no.${interaction.id}.modmenu`
                    ].includes(interactionCurr.customId)
                )
            )
                return

            if (interactionCurr.customId === `yes.${interaction.id}.modmenu`) {
                await interactionCurr.update({
                    content: "Punishing the user...",
                    components: []
                })
                await ModerationMenu.punishPerson(
                    id,
                    interaction,
                    client,
                    interactionCurr
                )
            }
            if (interactionCurr.customId === `no.${interaction.id}.modmenu`) {
                await interactionCurr.update({
                    content: "Cancelled the punish!",
                    components: []
                })
            }
        }

        client.on("interactionCreate", interactionFunc)

        setTimeout(async () => {
            await interaction.webhook.editMessage(followMessage.id, {
                content: "Expired",
                components: []
            })
            client.off("interactionCreate", interactionFunc)
        }, 300000)
    }

    @SnowflakePrimaryColumn()
    member!: string

    @SnowflakeColumn()
    message!: string

    @typeorm.Column({ length: 4000, charset: "utf8mb4" })
    message_text!: string

    @typeorm.Column("text", {
        transformer: {
            to: (value: bannedWordsOptions[]) => unicode.to(JSON5.stringify(value)),
            from: (value: string) => JSON5.parse(unicode.from(value))
        }
    })
    punishments!: bannedWordsOptions[]

    @typeorm.Column()
    offenses!: number

    @typeorm.Column({ transformer: unicode })
    current_word!: string
}

function getMostSevereList(
    punishments: BannedWordObj[],
    client: BotClient
): bannedWordsOptions[] {
    const punishmentWords: bannedWordsOptions[] = []
    for (const punishment of punishments) {
        if (!punishment.base) return []
        const word = client.filterWordsCached.banned.get(punishment.base)
        if (!word) return []

        punishmentWords.push({
            word: punishment.regex ? punishment.raw : punishment.base,
            punishment_type: word.punishment_type,
            duration: word.duration ? word.duration : null,
            reason: word.reason ? word.reason : undefined,
            exception: false
        })
    }
    return punishmentWords
        .filter(word => word !== undefined)
        .sort((a, b) => wordGreaterThanOther(a, b))
}

function wordGreaterThanOther(a: bannedWordsOptions, b: bannedWordsOptions): number {
    if (a.punishment_type && b.punishment_type) {
        const diffrence =
            punishmentValues[a.punishment_type] - punishmentValues[b.punishment_type]
        if (diffrence === 0) return 0
        if (diffrence > 0) return 1
    }
    return -1
}
