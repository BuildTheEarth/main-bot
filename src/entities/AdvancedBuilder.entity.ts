import typeorm from "typeorm"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn.decorator.js"
import Client from "../struct/Client.js"
import Guild from "../struct/discord/Guild.js"
import { noop } from "@buildtheearth/bot-utils"
import Roles from "../util/roles.util.js"
import { Cron } from 'croner'


@typeorm.Entity({ name: "advanced_builders" })
export default class AdvancedBuilder extends typeorm.BaseEntity {
    @SnowflakePrimaryColumn()
    builder: string
 
    @typeorm.CreateDateColumn({ name: "given_at" })
    givenAt: Date

    @typeorm.Column({ name: "role_name", default: "ADVANCED_BUILDER", nullable: false })
    roleName: "ADVANCED_BUILDER" | "COOL_BUILD"

    private removalTimeout: Cron

    async removeBuilder(client: Client): Promise<void> {
        this.removalTimeout.stop()
        const role = Guild.role(await client.customGuilds.main(), Roles[this.roleName])
        const member = await (await client.customGuilds.main()).members
            .fetch({ user: this.builder, cache: true })
            .catch(noop)
        if (!member) return

        await member.roles.remove(role)
        await this.remove()
    }

    schedule(client: Client): void {
        if (this.removalTimeout) this.removalTimeout.stop()
        const time = this.givenAt || new Date()
        time.setMonth(time.getMonth() + 3)

        // avoid TimeoutOverflowWarning; reschedule
        // (2147483647 ms is ~24 days)
        this.removalTimeout = new Cron(time, () => this.removeBuilder(client))
    }
}
