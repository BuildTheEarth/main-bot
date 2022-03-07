import typeorm from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"
import Client from "../struct/Client.js"
import GuildMember from "../struct/discord/GuildMember.js"
import milliseconds from "./transformers/milliseconds.transformer.js"
import { noop, pastTense } from "@buildtheearth/bot-utils"
import Discord from "discord.js"

@typeorm.Entity({ name: "timed_punishments" })
export default class TimedPunishment extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id: number

    @SnowflakeColumn()
    member: string

    @typeorm.Column()
    type: "mute" | "ban"

    @typeorm.Column({ transformer: milliseconds })
    length: number

    @typeorm.CreateDateColumn({ name: "created_at" })
    createdAt: Date

    get end(): Date {
        return new Date(this.createdAt.getTime() + this.length)
    }

    private undoTimeout: NodeJS.Timeout

    async undo(client: Client): Promise<void> {
        clearTimeout(this.undoTimeout)
        await this.remove()
        const user = await client.users.fetch(this.member)
        if (!user) return

        if (this.type === "mute") {
            const member: Discord.GuildMember = await (
                await client.customGuilds.main()
            ).members
                .fetch({ user })
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
