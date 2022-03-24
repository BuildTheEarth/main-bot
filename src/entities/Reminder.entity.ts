import typeorm from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"
import Client from "../struct/Client.js"
import { TextChannel } from "discord.js"
import { Cron } from "croner";
import dateEpochTransformer from "./transformers/dateEpoch.transformer.js";

@typeorm.Entity({ name: "reminders" })
export default class Reminder extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id: number

    @SnowflakeColumn()
    channel: string

    @typeorm.Column({ length: 1024 })
    message: string

    @typeorm.Column()
    interval: string

    @typeorm.CreateDateColumn({ name: "created_at" })
    createdAt: Date

    private reminderTimeout: Cron

    @typeorm.Column({name: "next_fire_date", type: "int", transformer: dateEpochTransformer})
    nextFireDate: Date

    remainder(reminder: Reminder): number {
        return (reminder.nextFireDate.getTime() - Date.now())
    }

    async send(client: Client): Promise<void> {
        const channel = client.channels.cache.get(this.channel) as TextChannel
        if (!channel) return

        channel.send(this.message)
        this.nextFireDate = this.reminderTimeout.next(new Date(Date.now()))
        await this.save()
    }

    async schedule(client: Client): Promise<void> {
        this.reminderTimeout = new Cron(this.interval, () => {this.send(client)})
        this.nextFireDate = this.reminderTimeout.next(new Date(Date.now()))
        await this.save()
    }

    async delete(): Promise<void> {
        this.reminderTimeout.stop()
        await this.remove()
    }
}
