import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableColumn,
    TableForeignKey
} from "typeorm"
import Discord from "discord.js"
import Client from "../struct/Client"
import ms from "ms"
import chalk from "chalk"
import { promisify } from "util"

const wait = promisify(setTimeout)

class Snowflake extends TableColumn {
    constructor(name: string) {
        super({ name, type: "varchar", length: "18" })
    }
}

// QueryRunner#changeColumn() DROPs and ADDs instead of ALTERing, resulting in data loss...
function alterColumn(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    type: string
) {
    return queryRunner.query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${type}`)
}

/*
some wonderfully cryptic things about the old bot to know if you're reading this:
- yes, column and table names use PascalCase
- the 'Logs.Length' column is stored as a string (eg '24h') instead of a number (eg, 86400 seconds)
    - this isn't that bad because the value is just shown to humans, but it still sounds ugly
- the 'Logs' table has a useless 'Value' column of type int
- the 'Members' table stores every. single. member. that. has. ever. joined. the. server!
    - the 'MutedUntil' column is for... you guessed it! storing end-of-mute timestamps
    - the 'tempBeta' column is for... you didn't guess it! storing end-of-ban timestamps
- the Snowflake-type columns (DiscordID, MessageID, ...) are of type varchar(25)
    - probably because they didn't know Snowflakes are 18 characters long
- timestamp columns (such as 'Logs.Time') are of type varchar(20) instead of datetime...........???
- the bot does not update MutedUntil (or tempBeta) if it expires and the user is no longer in the server
    - that means that users that were muted and later banned (or left) will Forever Remain™️ in the database
- for tables that already have IDs per se (for example, Members, which have DiscordIDs), there's still an additional incremental 'id' column
*/

const MAX_INT = 2147483647

export class Rewrite1607149857197 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const config = await queryRunner.hasTable("Config")
        const server = await queryRunner.hasTable("Server")
        const modpack = await queryRunner.hasTable("modpack_images")
        if (!config || !server || modpack) return

        // prettier-ignore
        console.log(chalk.red.bold(`
            /////////////////////////////////////////////////////////////////////////////////////////////
            //
            //   A reversion hasn't been written for the Rewrite migration, as it belongs to the old bot.
            //   Make sure you've made a backup, as there is *no* turning back.
            //   If you're sure you want to continue, wait 20 seconds and the migration will be run.
            //
            //   (If not, press Ctrl + C)
            //
            /////////////////////////////////////////////////////////////////////////////////////////////
        `).replace(/ {4,}/g, ""))
        await wait(20 * 1000)

        // Config, Server -> delete

        await queryRunner.dropTable("Config")
        await queryRunner.dropTable("Server")

        // -> modpack_images (entities/ModpackImage)

        await queryRunner.createTable(
            new Table({
                name: "modpack_images",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    { name: "key", type: "varchar", length: "255" },
                    { name: "set", type: "varchar", length: "255" },
                    { name: "url", type: "varchar", length: "255" },
                    { name: "credit", type: "varchar", length: "255", isNullable: true }
                ]
            })
        )

        // Members -> timed_punishments (entities/TimedPunishment)

        await queryRunner.createTable(
            new Table({
                name: "timed_punishments",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    { name: "member", type: "varchar", length: "18" },
                    { name: "type", type: "varchar", length: "255" },
                    { name: "length", type: "int" },
                    { name: "created_at", type: "datetime" }
                ]
            })
        )
        const now = Date.now()
        // delete everything mwHWHAHAHAHHAHAHAHHAHAHAHAHAHAH NO MORE MEMBERS
        // prettier-ignore
        await queryRunner.query("DELETE FROM Members WHERE MutedUntil IS NULL AND tempBeta IS NULL")

        type Member = { DiscordID: string; MutedUntil: string; tempBeta: string }
        // prettier-ignore
        const members: Member[] = (await queryRunner.query("SELECT DiscordID, MutedUntil, tempBeta FROM Members"))
            .sort((a, b) => a.id - b.id)

        for (const member of members) {
            // filter out expired punishments
            if (Number(member.MutedUntil) < now && Number(member.tempBeta) < now) continue
            // punishments didn't store start dates or lengths, just end dates
            const simulatedLength = Number(member.MutedUntil || member.tempBeta)
            if (simulatedLength / 1000 > MAX_INT) continue
            const simulatedCreationDate = new Date(Date.now() - simulatedLength)
            const type = member.MutedUntil ? "mute" : "ban"
            await queryRunner.query(
                "INSERT INTO timed_punishments (member, type, length, created_at) VALUES (?, ?, ?, ?)",
                [member.DiscordID, type, simulatedLength / 1000, simulatedCreationDate]
            )
        }

        await queryRunner.dropTable("Members")

        // Logs -> action_logs (entities/ActionLog)

        await queryRunner.renameColumn("Logs", "ID", "temp_id")
        await queryRunner.renameColumn("Logs", "temp_id", "id")
        await alterColumn(queryRunner, "Logs", "Action", "varchar(255)")
        await queryRunner.renameColumn("Logs", "Action", "temp_action")
        await queryRunner.renameColumn("Logs", "temp_action", "action")
        await alterColumn(queryRunner, "Logs", "Member", "varchar(18)")
        await alterColumn(queryRunner, "Logs", "Moderator", "varchar(18)")
        await queryRunner.renameColumn("Logs", "Moderator", "executor")
        await queryRunner.dropColumn("Logs", "Value")
        await queryRunner.renameColumn("Logs", "Reason", "temp_reason")
        await queryRunner.renameColumn("Logs", "temp_reason", "reason")
        await queryRunner.renameColumn("Logs", "Length", "temp_length")
        await queryRunner.renameColumn("Logs", "temp_length", "length")
        await alterColumn(queryRunner, "Logs", "ChannelID", "varchar(18)")
        await queryRunner.renameColumn("Logs", "ChannelID", "channel")
        await alterColumn(queryRunner, "Logs", "MessageID", "varchar(18)")
        await queryRunner.renameColumn("Logs", "MessageID", "message")
        const createdAt = new TableColumn({ name: "created_at", type: "datetime" })
        await queryRunner.addColumn("Logs", createdAt)
        const deletedAt = new TableColumn({
            name: "deleted_at",
            type: "datetime",
            isNullable: true
        })
        await queryRunner.addColumn("Logs", deletedAt)
        await queryRunner.addColumn("Logs", new Snowflake("deleter"))
        const deleteReason = new TableColumn({
            name: "delete_reason",
            type: "varchar",
            length: "1024",
            isNullable: true
        })
        await queryRunner.addColumn("Logs", deleteReason)
        const punishmentID = new TableColumn({
            name: "punishment_id",
            type: "int",
            isNullable: true
        })
        await queryRunner.addColumn("Logs", punishmentID)
        const punishmentFK = new TableForeignKey({
            columnNames: ["punishment_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "timed_punishments",
            onDelete: "SET NULL"
        })
        await queryRunner.createForeignKey("Logs", punishmentFK)

        type Log = { id: number; length: string; message: string }
        // prettier-ignore
        const logs: Log[] = await queryRunner.query("SELECT id, length, message FROM Logs")
        for (const log of logs) {
            if (!log.message) continue
            const deconstructed = Discord.SnowflakeUtil.deconstruct(log.message)
            const simulatedCreationDate = new Date(deconstructed.timestamp)
            const milliseconds = log.length === null ? 0 : ms(log.length) || 0
            await queryRunner.query(
                "UPDATE Logs SET length = ? , created_at = ? WHERE id = ?",
                [milliseconds, simulatedCreationDate, log.id]
            )
        }

        await queryRunner.renameTable("Logs", "action_logs")

        // Suggestions -> suggestions (entities/Suggestion)

        await queryRunner.renameTable("Suggestions", "old_suggestions")

        await queryRunner.createTable(
            new Table({
                name: "suggestions",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    { name: "anonymous", type: "tinyint" },
                    { name: "author", type: "varchar", length: "18" },
                    { name: "body", type: "varchar", length: "2048" },
                    { name: "created_at", type: "datetime" },
                    { name: "deleted_at", type: "datetime", isNullable: true },
                    { name: "deleter", type: "varchar", length: "18", isNullable: true },
                    { name: "extends", type: "int", isNullable: true },
                    { name: "message", type: "varchar", length: "18" },
                    { name: "number", type: "int", isNullable: true },
                    { name: "staff", type: "tinyint" },
                    { name: "status", type: "varchar", length: "255", isNullable: true },
                    // prettier-ignore
                    { name: "status_reason", type: "varchar", length: "2048", isNullable: true },
                    // prettier-ignore
                    { name: "status_updater", type: "varchar", length: "18", isNullable: true },
                    { name: "teams", type: "varchar", length: "255", isNullable: true },
                    { name: "title", type: "varchar", length: "255" }
                ]
            })
        )

        const KNOWN_USERS = {
            Xocaj: "379431523360964608",
            Xesau: "146312749146701824",
            gutterguy: "260534191274328076",
            NicDivision: "371391508458373120",
            SwegFish: "146374610110251008",
            saltypotato: "223918685750951939",
            Gabe: "339338835970359297",
            olivephio: "302148145352278016",
            Suchet: "172308595046744064",
            noahhusby: "555520007837319178",
            Xylotrupes: "221768951452008448",
            arc25272: "369661965376946176",
            Danmiko: "543847509529853971",
            cAtte_: "391984806638125066"
        }

        const client = new Client()
        await client.config.load()
        await client.login()

        // prettier-ignore
        const suggestionsChannel = await client.channels.fetch("705286174356537394", true) as Discord.TextChannel
        // prettier-ignore
        const oldSuggestions = (await queryRunner.query("SELECT * FROM old_suggestions"))
            .sort((a, b) => a.id - b.id)

        for (const oldSuggestion of oldSuggestions) {
            // test suggestions
            if (oldSuggestion.id < 342) continue
            const { messageID } = oldSuggestion
            const message = await suggestionsChannel.messages
                .fetch(messageID, true)
                .catch(() => null)
            if (!message) continue

            let status = oldSuggestion.status && oldSuggestion.status.toLowerCase()
            if (status.startsWith("moreinfo")) status = "information"
            if (status === "suggested") status = null

            const embed = message.embeds[0]
            const description = embed.description
            const statusField = embed.fields.find(field => field.name === "Status").value
            const statusUpdaterName = statusField.match(/ by (.+)/)?.[1]

            const number = oldSuggestion.id
            const _extends = null
            const author = message.author.id
            const anonymous = false
            const title = description.match(/\*\*(.+)\*\*\n/)?.[1]
            const body = description.split("\n").slice(1).join("\n")
            const teams = oldSuggestion.team === "none" ? null : oldSuggestion.team
            const statusUpdater = KNOWN_USERS[statusUpdaterName] || null
            const statusReason = statusField.match(/Reason : \*\*(.+)\*\*/)?.[1] || null
            const _message = message.id
            const staff = true
            const createdAt = new Date(message.createdTimestamp)
            const deletedAt = null
            const deleter = null

            // god forgive me
            // prettier-ignore
            queryRunner.query(
                `INSERT INTO suggestions(number, extends, author, anonymous, title, body, teams, status_updater, status_reason, message, staff, created_at, deleted_at, deleter)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                 [number, _extends, author, anonymous, title, body, teams, statusUpdater, statusReason, _message, staff, createdAt, deletedAt, deleter]
            )
        }

        await queryRunner.dropTable("old_suggestions")

        // Snippets (formerly Commands) -> snippets (entities/Snippet)

        // case-insensitivity or whatever
        await queryRunner.renameTable("Snippets", "temp_snippets")
        await queryRunner.renameTable("temp_snippets", "snippets")

        await queryRunner.renameColumn("snippets", "ID", "temp_id")
        await queryRunner.renameColumn("snippets", "temp_id", "id")
        await alterColumn(queryRunner, "snippets", "Command", "varchar(32)")
        await queryRunner.renameColumn("snippets", "Command", "name")
        await alterColumn(queryRunner, "snippets", "Response", "varchar(2000)")
        await queryRunner.renameColumn("snippets", "Response", "body")
        await alterColumn(queryRunner, "snippets", "Language", "varchar(2)")
        await queryRunner.renameColumn("snippets", "Language", "temp_language")
        await queryRunner.renameColumn("snippets", "temp_language", "language")
    }

    public async down(): Promise<void> {
        console.log(
            chalk.red.bold(
                "\n\nYou can't revert the Rewrite migration. Get your backup ready!\n\n"
            )
        )
        process.exit(0)
    }
}
