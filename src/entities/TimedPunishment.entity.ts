import typeorm from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"
import Client from "../struct/Client.js"
import GuildMember from "../struct/discord/GuildMember.js"
import milliseconds from "./transformers/milliseconds.transformer.js"
import { noop, pastTense } from "@buildtheearth/bot-utils"
import { Cron } from "croner"

@typeorm.Entity({ name: "timed_punishments" })
export default class TimedPunishment extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @SnowflakeColumn()
    member!: string

    @typeorm.Column()
    type!: "mute" | "ban"

    @typeorm.Column({ transformer: milliseconds })
    length!: number

    @typeorm.CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    get end(): Date {
        return new Date(this.createdAt.getTime() + this.length)
    }

    async undo(client: Client): Promise<void> {
        if (client.punishmentTimeouts.has(this.member)) {
            const setPunish = client.punishmentTimeouts.get(this.member)
            if (setPunish && setPunish[this.type]) {
                setPunish[this.type]?.stop()
            }
        }
        await this.remove()
        const user = await client.users.fetch(this.member)
        if (!user) return

        if (this.type === "mute") {
            const member = await client.customGuilds
                .main()
                .members.fetch({ user })
                .catch(noop)
            if (!member) return
            await GuildMember.unmute(member, "End of punishment").catch(noop)
        } else if (this.type === "ban") {
            await (await client.customGuilds.main()).members
                .unban(user, "End of punishment")
                .catch(noop)
        }

        const undid = "un" + pastTense(this.type)
        client.logger.info(`Automatically ${undid} ${user.tag}.`)
    }

    schedule(client: Client): void {
        let setPunish: {
            ban: Cron | null
            mute: Cron | null
        }= { ban: null, mute: null }
        if (client.punishmentTimeouts.has(this.member)) {
            const setPunishTemp = client.punishmentTimeouts.get(this.member)
            if (setPunishTemp) setPunish = setPunishTemp
        }
        setPunish[this.type] = new Cron(this.end, () => {
            this.undo(client)
        })
        client.punishmentTimeouts.set(this.member, setPunish)
    }
}
