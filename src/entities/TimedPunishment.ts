import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import millisecondTransformer from "../util/millisecondTransformer"

@Entity({ name: "timed_punishments" })
export default class TimedPunishment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 18 })
    user: string

    @Column()
    type: "mute" | "ban"

    @Column({ transformer: millisecondTransformer })
    end: number

    async undo(client: Client) {
        const guild = client.guilds.cache.get(client.config.guilds.main)
        if (this.type === "mute") {
            const member: GuildMember = await guild.members
                .fetch({ user: this.user, cache: true })
                .catch(() => null)
            if (!member) return
            member.unmute("End of punishment")
        } else if (this.type === "ban") {
            await guild.members.unban(this.user, "End of punishment").catch(() => null)
        }
    }

    schedule(client: Client): NodeJS.Timeout {
        return setTimeout(async () => {
            await this.undo(client)
            await this.remove()
        }, this.end - Date.now())
    }
}
