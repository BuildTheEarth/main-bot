import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn
} from "typeorm"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import millisecondTransformer from "../util/millisecondTransformer"

@Entity({ name: "timed_punishments" })
export default class TimedPunishment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 18 })
    member: string

    @Column()
    type: "mute" | "ban"

    @Column({ transformer: millisecondTransformer })
    length: number

    @CreateDateColumn()
    createdAt: Date

    get end(): Date {
        return new Date(this.createdAt.getTime() + this.length)
    }

    async undo(client: Client) {
        const guild = client.guilds.cache.get(client.config.guilds.main)
        if (this.type === "mute") {
            const member: GuildMember = await guild.members
                .fetch({ user: this.member, cache: true })
                .catch(() => null)
            if (!member) return
            member.unmute("End of punishment")
        } else if (this.type === "ban") {
            await guild.members.unban(this.member, "End of punishment").catch(() => null)
        }
    }

    schedule(client: Client): NodeJS.Timeout {
        if (this.length === 0) return
        const timeout = this.end.getTime() - Date.now()
        return setTimeout(async () => {
            await this.undo(client)
            await this.remove()
        }, timeout)
    }
}
