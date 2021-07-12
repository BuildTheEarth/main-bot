import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn
} from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn"
import Client from "../struct/Client"
import milliseconds from "./transformers/milliseconds"
import Discord from "discord.js"

@Entity({ name: "reminders" })
export default class Reminder extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @SnowflakeColumn()
    channel: string

    @Column({ length: 1024 })
    message: string

    @Column({ transformer: milliseconds })
    interval: number

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

    get end(): Date {
        return new Date(this.createdAt.getTime() + this.interval)
    }

    private reminderTimeout: NodeJS.Timeout

    async sendReminder(client: Client): Promise<void> {
        const channel = client.channels.cache.find(
            channel =>
                // @ts-ignore
                channel.id === this.channel
        ) as Discord.TextChannel
        if (!channel) return
        channel.send(this.message)
    }

    schedule(client: Client): void {
        if (this.interval === 0) return
        const timeout = this.end.getTime() - Date.now()

        // avoid TimeoutOverflowWarning; reschedule
        // (2147483647 ms is ~24 days)
        if (timeout > 2147483647) {
            this.reminderTimeout = setTimeout(() => this.schedule(client), 2147483647)
        } else {
            this.reminderTimeout = setTimeout(() => this.sendReminder(client), timeout)
        }
    }

    async delete(): Promise<void> {
        clearTimeout(this.reminderTimeout)
        await this.remove()
    }
}
