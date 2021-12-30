import Discord from "discord.js"
import { Entity, Column, BaseEntity } from "typeorm"
import punishmentValues from "../data/punishmentValues"
import { BannedWordObj } from "../struct/client/BannedWordFilter"
import BannedWord from "./BannedWord"
import SnowflakeColumn from "./decorators/SnowflakeColumn"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn"

@Entity({ name: "moderation_menus" })
export default class ModerationMenu extends BaseEntity {
    public static async createMenu(
        message: Discord.Message,
        filterResponse: BannedWordObj[]
    ): Promise<ModerationMenu> {
        const existingMenu = await ModerationMenu.findOne({ member: message.author.id })

        if (existingMenu) {
            existingMenu.offenses += 1
            const truePunishments = await getMostSevereList(filterResponse)
            existingMenu.punishments.push(...truePunishments)
            existingMenu.save()
            return existingMenu
        }

        const modMenu = new ModerationMenu()
        modMenu.member = message.member.id
        modMenu.message_text = message.content
        const truePunishments = await getMostSevereList(filterResponse)
        modMenu.punishments = truePunishments
        modMenu.offenses = 1

        const embed = new Discord.MessageEmbed().addFields([
            { name: "Message", value: modMenu.message_text },
            { name: "Offenses", value: modMenu.offenses.toString() }
        ])
        //TODO: FINISH THIS

        await message.delete()
        return modMenu
    }
    @SnowflakePrimaryColumn()
    member: string

    @SnowflakeColumn()
    message: string

    @Column({ length: 2000 })
    message_text: string

    @Column({ type: "json" })
    punishments: BannedWord[]

    @Column()
    offenses: number
}

async function getMostSevereList(punishments: BannedWordObj[]): Promise<BannedWord[]> {
    const punishmentWords: BannedWord[] = []
    for await (const punishment of punishments) {
        punishmentWords.push(
            await BannedWord.findOne({ where: { word: punishment.base } })
        )
    }
    return punishmentWords
        .filter(word => word !== undefined)
        .sort((a, b) => wordGreaterThanOther(a, b))
}

function wordGreaterThanOther(a: BannedWord, b: BannedWord): number {
    const diffrence =
        punishmentValues[a.punishment_type] - punishmentValues[b.punishment_type]
    if (diffrence === 0) return 0
    if (diffrence > 0) return 1
    return -1
}
