import typeorm from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"
import BotClient from "../struct/BotClient.js"
import { TextChannel } from "discord.js"
import { Cron } from "croner"
import dateEpochTransformer from "./transformers/dateEpoch.transformer.js"
import unicode from "./transformers/unicode.transformer.js"

@typeorm.Entity({ name: "reminders" })
export default class Reminder extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @SnowflakeColumn()
    channel!: string

    @typeorm.Column({ length: 1024, transformer: unicode })
    message!: string

    @typeorm.Column()
    interval!: string

    @typeorm.CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @typeorm.Column({
        name: "next_fire_date",
        type: "int",
        transformer: dateEpochTransformer
    })
    nextFireDate!: Date

    remainder(reminder: Reminder): number {
        return reminder.nextFireDate.getTime() - Date.now()
    }

    async send(client: BotClient): Promise<void> {
        const channel = client.channels.cache.get(this.channel) as TextChannel
        if (!channel) return

        channel.send({
            content: this.message,
            allowedMentions: { parse: ['users', 'roles'] }
        })
        const tempReminderTimeout = client.reminderTimeouts.get(this.id)
        if (tempReminderTimeout) {
            const tempNext = tempReminderTimeout.next(new Date(Date.now()))
            if (tempNext) this.nextFireDate = tempNext
        }
        await this.save()
    }

    async schedule(client: BotClient): Promise<void> {
        client.reminderTimeouts.set(
            this.id,
            new Cron(this.interval, () => {
                this.send(client)
            })
        )
        const tempReminderTimeout = client.reminderTimeouts.get(this.id)
        if (tempReminderTimeout) {
            const tempNext = tempReminderTimeout.next(new Date(Date.now()))
            if (tempNext) this.nextFireDate = tempNext
        }
        await this.save()
    }

    async delete(): Promise<void> {
        if (client.reminderTimeouts.has(this.id))
            client.reminderTimeouts.get(this.id)?.stop()
        await this.remove()
    }
}
