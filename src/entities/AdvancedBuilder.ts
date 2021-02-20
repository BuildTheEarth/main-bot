import { Entity, CreateDateColumn, BaseEntity } from "typeorm"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn"
import Client from "../struct/Client"
import Roles from "../util/roles"
import noop from "../util/noop"

@Entity({ name: "advanced_builders" })
export default class AdvancedBuilder extends BaseEntity {
    @SnowflakePrimaryColumn()
    builder: string

    @CreateDateColumn({ name: "given_at" })
    givenAt: Date

    private removalTimeout: NodeJS.Timeout

    async removeBuilder(client: Client): Promise<void> {
        clearTimeout(this.removalTimeout)
        const role = client.guilds.main.role(Roles.ADVANCED_BUILDER)
        const member = await client.guilds.main.members
            .fetch({ user: this.builder, cache: true })
            .catch(noop)
        if (!member) return

        await member.roles.remove(role)
        await this.remove()
    }

    schedule(client: Client): void {
        if (this.removalTimeout) clearTimeout(this.removalTimeout)
        const time = this.givenAt || new Date()
        time.setMonth(time.getMonth() + 3)
        const timeout = time.getTime() - Date.now()

        // avoid TimeoutOverflowWarning; reschedule
        // (2147483647 ms is ~24 days)
        if (timeout > 2147483647) {
            this.removalTimeout = setTimeout(() => this.schedule(client), 2147483647)
        } else {
            this.removalTimeout = setTimeout(() => this.removeBuilder(client), timeout)
        }
    }
}
