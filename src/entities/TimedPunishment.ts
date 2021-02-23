import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn
} from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import milliseconds from "./transformers/milliseconds"
import noop from "../util/noop"
import pastTense from "../util/pastTense"

@Entity({ name: "timed_punishments" })
export default class TimedPunishment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @SnowflakeColumn()
    member: string

    @Column()
    type: "mute" | "ban"

    @Column({ transformer: milliseconds })
    length: number

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

    get end(): Date {
        return new Date(this.createdAt.getTime() + this.length)
    }

    private undoTimeout: NodeJS.Timeout

    async undo(client: Client): Promise<void> {
        clearTimeout(this.undoTimeout)
        const user = await client.users.fetch(this.member, true)
        if (!user) return

        if (this.type === "mute") {
            const member: GuildMember = await client.guilds.main.members
                .fetch({ user, cache: true })
                .catch(noop)
            if (!member) return
            await member.unmute("End of punishment").catch(noop)
        } else if (this.type === "ban") {
            await client.guilds.main.members.unban(user, "End of punishment").catch(noop)
        }

        const undid = "un" + pastTense(this.type)
        client.logger.info(`Automatically ${undid} ${user.tag}.`)

        await this.remove()
    }

    schedule(client: Client): void {
        if (this.length === 0) return
        const timeout = this.end.getTime() - Date.now()

        // avoid TimeoutOverflowWarning; reschedule
        // (2147483647 ms is ~24 days)
        if (timeout > 2147483647) {
            this.undoTimeout = setTimeout(() => this.schedule(client), 2147483647)
        } else {
            this.undoTimeout = setTimeout(() => this.undo(client), timeout)
        }
    }
}
