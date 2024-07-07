import typeorm from "typeorm"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn.decorator.js"
import Client from "../struct/Client.js"
import Guild from "../struct/discord/Guild.js"
import { noop } from "@buildtheearth/bot-utils"
import { Cron } from "croner"

@typeorm.Entity({ name: "advanced_builders" })
export default class AdvancedBuilder extends typeorm.BaseEntity {
    @SnowflakePrimaryColumn()
    builder!: string

    @typeorm.CreateDateColumn({ name: "given_at" })
    givenAt!: Date

    @typeorm.Column({ name: "duration", default: 3, nullable: false })
    duration!: number

    @typeorm.Column({ name: "role_name", default: "ADVANCED_BUILDER", nullable: false })
    roleName!: "ADVANCED_BUILDER" | "COOL_BUILD"

    async removeBuilder(client: Client): Promise<void> {
        if (client.honorBuilderTimeouts.has(this.builder))
            client.honorBuilderTimeouts.get(this.builder)?.stop()
        const role = Guild.role(
            await client.customGuilds.main(),
            client.roles[this.roleName]
        )
        const member = await (await client.customGuilds.main()).members
            .fetch({ user: this.builder, cache: true })
            .catch(noop)
        if (!member) return

        await member.roles.remove(role)
        await this.remove()
    }

    schedule(client: Client): void {
        if (client.honorBuilderTimeouts.has(this.builder))
            client.honorBuilderTimeouts.get(this.builder)?.stop()
        let time = this.givenAt || new Date()
        time = new Date(time.getTime())
        time.setMonth(time.getMonth() + this.duration)

        if (time.getMilliseconds() < Date.now()) {
            this.removeBuilder(client)
            return
        }

        client.honorBuilderTimeouts.set(
            this.builder,
            new Cron(time, () => this.removeBuilder(client))
        )
    }

    newDuration(client: Client, duration: number): boolean {
        if (client.honorBuilderTimeouts.has(this.builder)) {
            this.duration = duration

            this.schedule(client)

            this.save()

            return true
        } else {
            return false
        }
    }

    extend(client: Client, extend: number): boolean {
        if (this.duration + extend < 0) return false

        let time = this.givenAt || new Date()
        time = new Date(time.getTime())

        time.setMonth(time.getMonth() + this.duration + extend)

        if (time <= new Date()) return false

        return this.newDuration(client, this.duration + extend)
    }
}
