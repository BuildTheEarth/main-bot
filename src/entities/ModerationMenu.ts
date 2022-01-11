import Discord from "discord.js"
import _ from "lodash"
import { Entity, Column, BaseEntity } from "typeorm"
import punishmentValues from "../data/punishmentValues"
import Client from "../struct/Client"
import { BannedWordObj } from "../struct/client/BannedWordFilter"
import formatPunishmentTime from "../util/formatPunishmentTime"
import truncateString from "../util/truncateString"
import { bannedWordsOptions } from "./BannedWord"
import SnowflakeColumn from "./decorators/SnowflakeColumn"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn"
import JSON5 from "json5"

function getDuration(duration: number): string {
    if (duration === null) return "Indefinite"
    return formatPunishmentTime(duration, true)
}

@Entity({ name: "moderation_menus" })
export default class ModerationMenu extends BaseEntity {
    public static async createMenu(
        message: Discord.Message,
        filterResponse: BannedWordObj[],
        client: Client
    ): Promise<ModerationMenu> {
        await message.delete()

        const existingMenu = await ModerationMenu.findOne({ member: message.author.id })

        if (existingMenu) {
            existingMenu.offenses += 1
            const truePunishments = getMostSevereList(filterResponse, client)
            existingMenu.punishments.push(...truePunishments)
            existingMenu.punishments = _.uniqBy(existingMenu.punishments, "word")
            existingMenu.current_word = existingMenu.punishments[0].word
            existingMenu.save()

            const embed = new Discord.MessageEmbed().addFields([
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
                    value: getDuration(existingMenu.punishments[0].duration)
                },
                { name: "Reason", value: existingMenu.punishments[0].reason },
                { name: "Trigger", value: existingMenu.punishments[0].word }
            ])

            const punishmentOptions = existingMenu.punishments.map(punishment => {
                const punish = {
                    label: truncateString(punishment.reason, 15),
                    description: `${punishment.punishment_type} for ${getDuration(
                        punishment.duration
                    )}, Word is ${punishment.word}`,
                    value: punishment.word,
                    default: false
                } as Discord.MessageSelectOptionData
                return punish
            })

            const row = [
                new Discord.MessageActionRow().addComponents(
                    new Discord.MessageSelectMenu()
                        .setCustomId(`modmenu.${existingMenu.member}.menu`)
                        .setMinValues(1)
                        .setMaxValues(1)
                        .addOptions(punishmentOptions)
                        .setPlaceholder("Select a punishment")
                ),
                new Discord.MessageActionRow().addComponents(
                    new Discord.MessageButton()
                        .setCustomId(`modmenu.${existingMenu.member}.punish`)
                        .setStyle("PRIMARY")
                        .setLabel("Punish"),
                    new Discord.MessageButton()
                        .setCustomId(`modmenu.${existingMenu.member}.pardon`)
                        .setStyle("DANGER")
                        .setLabel("Pardon")
                )
            ]

            const channel = (await client.channels.fetch(
                client.config.logging.modLogs
            )) as Discord.TextChannel

            const modMenuMessage = await channel.messages.fetch(existingMenu.message, {
                force: true
            })
            if (modMenuMessage) {
                await modMenuMessage.edit({ embeds: [embed], components: row })
            }

            return existingMenu
        }

        const modMenu = new ModerationMenu()
        modMenu.member = message.member.id
        modMenu.message_text = message.content
        const truePunishments = getMostSevereList(filterResponse, client)
        modMenu.punishments = truePunishments
        modMenu.offenses = 1
        modMenu.current_word = modMenu.punishments[0].word

        const embed = new Discord.MessageEmbed().addFields([
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
                value: getDuration(modMenu.punishments[0].duration)
            },
            { name: "Reason", value: modMenu.punishments[0].reason },
            { name: "Trigger", value: modMenu.punishments[0].word }
        ])

        const punishmentOptions = modMenu.punishments.map(punishment => {
            const punish = {
                label: truncateString(punishment.reason, 15),
                description: `${punishment.punishment_type} for ${getDuration(
                    punishment.duration
                )}, Word is ${punishment.word}`,
                value: punishment.word,
                default: false
            } as Discord.MessageSelectOptionData
            return punish
        })

        const row = [
            new Discord.MessageActionRow().addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId(`modmenu.${modMenu.member}.menu`)
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(punishmentOptions)
                    .setPlaceholder("Select a punishment")
            ),
            new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton()
                    .setCustomId(`modmenu.${modMenu.member}.punish`)
                    .setStyle("PRIMARY")
                    .setLabel("Punish"),
                new Discord.MessageButton()
                    .setCustomId(`modmenu.${modMenu.member}.pardon`)
                    .setStyle("DANGER")
                    .setLabel("Pardon")
            )
        ]
        //TODO: FINISH THIS
        const channel = (await client.channels.fetch(
            client.config.logging.modLogs
        )) as Discord.TextChannel

        modMenu.message = (await channel.send({ embeds: [embed], components: row })).id

        modMenu.save()

        return modMenu
    }

    public static async updateMenu(
        id: string,
        interaction: Discord.SelectMenuInteraction
    ): Promise<ModerationMenu> {
        const modMenu = await ModerationMenu.findOne({ member: id })

        if (!modMenu) return null

        const punishment = modMenu.punishments.find(
            punishment => punishment.word === interaction.values[0]
        )

        const embed = new Discord.MessageEmbed().addFields([
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
                value: getDuration(punishment.duration)
            },
            { name: "Reason", value: punishment.reason },
            { name: "Trigger", value: punishment.word }
        ])

        interaction.editReply({ embeds: [embed] })
        modMenu.current_word = punishment.word
        await modMenu.save()
    }

    public static async pardon(
        id: string,
        interaction: Discord.ButtonInteraction
    ): Promise<void> {
        const modMenu = await ModerationMenu.findOne({ member: id })

        if (!modMenu) return null

        const embed = new Discord.MessageEmbed().addFields([
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

        await (interaction.message as Discord.Message).edit({
            embeds: [embed],
            components: []
        })

        await modMenu.remove()
    }

    public static async pardonConfirm(
        id: string,
        interaction: Discord.ButtonInteraction,
        client: Client
    ): Promise<void> {
        const components = [
            new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton()
                    .setCustomId(`yes.${interaction.id}.modmenu`)
                    .setStyle("PRIMARY")
                    .setLabel("Pardon"),
                new Discord.MessageButton()
                    .setCustomId(`no.${interaction.id}.modmenu`)
                    .setStyle("DANGER")
                    .setLabel("No")
            )
        ]
        const followMessage = await interaction.followUp({
            content: "Are you sure you want to pardon this user?",
            components: components,
            fetchReply: true,
            ephemeral: true
        })

        console.log(followMessage)

        client.on("interactionCreate", async (interactionCurr: Discord.Interaction) => {
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

                await ModerationMenu.pardon(id, interaction)
            }
            if (interactionCurr.customId === `no.${interaction.id}.modmenu`) {
                await interactionCurr.update({
                    content: "Cancelled the pardon!",
                    components: []
                })
            }
        })
    }

    @SnowflakePrimaryColumn()
    member: string

    @SnowflakeColumn()
    message: string

    @Column({ length: 2000 })
    message_text: string

    @Column("text", {
        transformer: {
            to: (value: bannedWordsOptions[]) => JSON5.stringify(value),
            from: (value: string) => JSON5.parse(value)
        }
    })
    punishments: bannedWordsOptions[]

    @Column()
    offenses: number

    @Column()
    current_word: string
}

function getMostSevereList(
    punishments: BannedWordObj[],
    client: Client
): bannedWordsOptions[] {
    const punishmentWords: bannedWordsOptions[] = []
    for (const punishment of punishments) {
        const word = client.filterWordsCached.banned[punishment.base]
        if (!word) return []

        punishmentWords.push({
            word: punishment.base,
            punishment_type: word.punishment_type,
            duration: word.duration,
            reason: word.reason,
            exception: false
        })
    }
    return punishmentWords
        .filter(word => word !== undefined)
        .sort((a, b) => wordGreaterThanOther(a, b))
}

function wordGreaterThanOther(a: bannedWordsOptions, b: bannedWordsOptions): number {
    const diffrence =
        punishmentValues[a.punishment_type] - punishmentValues[b.punishment_type]
    if (diffrence === 0) return 0
    if (diffrence > 0) return 1
    return -1
}
