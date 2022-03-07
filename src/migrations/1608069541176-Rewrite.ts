import typeorm from "typeorm"
import Discord from "discord.js"
import Client from "../struct/Client.js"
import chalk from "chalk"
import { promisify } from "util"
import { ms } from "@buildtheearth/bot-utils"

const wait = promisify(setTimeout)

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
const ACTION_TYPES = ["warn", "mute", "kick", "ban", "unmute", "unban"]

export class Rewrite1608069541176 implements typeorm.MigrationInterface {
    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {
        const config = await queryRunner.hasTable("Config")
        const server = await queryRunner.hasTable("Server")
        const modpack = await queryRunner.hasTable("modpack_images")
        if (!config || !server || modpack) return

        // prettier-ignore
        console.log(chalk.red.bold(`
/////////////////////////////////////////////////////////////////////////////////////////////

   A reversion hasn't been written for the Rewrite migration, as it belongs to the old bot.
   Make sure you've made a backup, as there is *no* turning back.
   If you're sure you want to continue, wait 20 seconds and the migration will be run.

   (If not, press Ctrl + C)

/////////////////////////////////////////////////////////////////////////////////////////////
        `))
        await wait(20 * 1000)

        // Config, Server ->

        await queryRunner.query("DROP TABLE IF EXISTS Config")
        await queryRunner.query("DROP TABLE IF EXISTS Server")

        // Logs, Members -> action_logs, timed_punishments

        await queryRunner.query(`
CREATE TABLE \`timed_punishments\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`member\` varchar(18) NOT NULL,
    \`type\` varchar(255) NOT NULL,
    \`length\` int NOT NULL,
    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=1028 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `)

        await queryRunner.query(`
CREATE TABLE \`action_logs\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`action\` varchar(255) NOT NULL,
    \`member\` varchar(18) NOT NULL,
    \`executor\` varchar(18) NOT NULL,
    \`length\` int DEFAULT NULL,
    \`channel\` varchar(18) NOT NULL,
    \`message\` varchar(18) NOT NULL,
    \`punishment_id\` int DEFAULT NULL,
    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    \`deleted_at\` datetime(6) DEFAULT NULL,
    \`reason_image\` varchar(255) DEFAULT NULL,
    \`deleter\` varchar(18) DEFAULT NULL,
    \`reason\` varchar(1024) NOT NULL,
    \`delete_reason\` varchar(1024) DEFAULT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`REL_TIMED_PUNISHMENT\` (\`punishment_id\`),
    CONSTRAINT \`FK_PUNISHMENT_ID\` FOREIGN KEY (\`punishment_id\`) REFERENCES \`timed_punishments\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `)

        await queryRunner.query("ALTER TABLE Logs DROP COLUMN Value")
        const logs = await queryRunner.query("SELECT * FROM Logs ORDER BY ID ASC")
        for (const log of logs) {
            const msLength = log.Length === null ? 0 : ms(log.Length) || 0
            let length = Math.round(msLength / 1000)
            // (MAX_INT as seconds is equal to 24,855 days!)
            if (length > MAX_INT) length = 0 // (-> permanent)
            if (!["mute", "ban"].includes(log.Action)) length = null
            if (log.Action.startsWith("perm"))
                (length = 0) && (log.Action = log.Action.slice(4))
            if (!ACTION_TYPES.includes(log.Action)) continue
            const createdAt = new Date(Number(log.Time))
            await queryRunner.query(
                `
INSERT INTO action_logs
    (id, action, member, executor, length, channel, message, created_at, reason)
VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    log.ID,
                    log.Action,
                    log.Member,
                    log.Moderator,
                    length,
                    log.ChannelID,
                    log.MessageID || "unknown",
                    createdAt,
                    log.Reason.trim()
                ]
            )
        }

        // prettier-ignore
        await queryRunner.query("DELETE FROM Members WHERE MutedUntil IS NULL AND tempBeta IS NULL")
        // prettier-ignore
        const members = await queryRunner.query("SELECT DiscordID as id, MutedUntil as muteEnd, tempBeta as banEnd FROM Members ORDER BY ID ASC")

        // punishments didn't store start dates or lengths, just end dates
        for (const member of members) {
            const end = Number(member.banEnd ? member.banEnd : member.muteEnd)
            if (end < Date.now()) continue
            const type = member.banEnd ? "ban" : "mute"
            const simulatedCreationDate = new Date()
            const simulatedLength = end - simulatedCreationDate.getTime()
            if (simulatedLength > MAX_INT) continue

            await queryRunner.query(
                `
INSERT INTO timed_punishments
    (member, type, length, created_at)
VALUES
    (?, ?, ?, ?)
            `,
                [
                    member.id,
                    type,
                    Math.round(simulatedLength / 1000),
                    simulatedCreationDate
                ]
            )
        }

        await queryRunner.query("DROP TABLE Members")
        await queryRunner.query("DROP TABLE Logs")

        // -> modpack_images

        await queryRunner.query(`
CREATE TABLE \`modpack_images\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`key\` varchar(255) NOT NULL,
    \`set\` varchar(255) NOT NULL,
    \`url\` varchar(255) NOT NULL,
    \`credit\` varchar(255) DEFAULT NULL,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `)

        // Snippets -> snippets

        await queryRunner.query("ALTER TABLE Snippets RENAME TO old_snippets")
        await queryRunner.query(`
CREATE TABLE \`snippets\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`name\` varchar(32) NOT NULL,
    \`language\` varchar(2) NOT NULL,
    \`body\` varchar(2000) NOT NULL,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `)

        // prettier-ignore
        const snippets = await queryRunner.query("SELECT * FROM old_snippets ORDER BY ID ASC")
        for (const snippet of snippets) {
            if (snippet.Language.length > 2) continue
            await queryRunner.query(
                `
INSERT INTO snippets
    (name, language, body)
VALUES
    (?, ?, ?)
            `,
                [snippet.Command, snippet.Language, snippet.Response]
            )
        }

        await queryRunner.query("DROP TABLE old_snippets")

        // Suggestions -> suggestions

        await queryRunner.query("ALTER TABLE Suggestions RENAME TO old_suggestions")

        const client = new Client({
            intents: [
                Discord.Intents.FLAGS.GUILDS,
                Discord.Intents.FLAGS.GUILD_MEMBERS,
                Discord.Intents.FLAGS.GUILD_BANS,
                Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
                Discord.Intents.FLAGS.GUILD_WEBHOOKS,
                Discord.Intents.FLAGS.GUILD_PRESENCES,
                Discord.Intents.FLAGS.GUILD_MESSAGES,
                Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Discord.Intents.FLAGS.DIRECT_MESSAGES,
                Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
            ]
        })
        await client.config.load()
        await client.login()

        // prettier-ignore
        const suggestionsChannel = await client.channels.fetch("705286174356537394", {force: true}) as Discord.TextChannel
        // prettier-ignore
        const oldSuggestions = await queryRunner.query("SELECT * FROM old_suggestions ORDER BY ID ASC")

        await queryRunner.query(`
CREATE TABLE \`suggestions\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`author\` varchar(18) NOT NULL,
    \`body\` varchar(2048) NOT NULL,
    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    \`message\` varchar(18) NOT NULL,
    \`staff\` tinyint NOT NULL,
    \`status\` varchar(255) DEFAULT NULL,
    \`number\` int DEFAULT NULL,
    \`extends\` int DEFAULT NULL,
    \`teams\` varchar(255) DEFAULT NULL,
    \`deleted_at\` datetime(6) DEFAULT NULL,
    \`title\` varchar(255) NOT NULL,
    \`deleter\` varchar(18) DEFAULT NULL,
    \`anonymous\` tinyint NOT NULL,
    \`status_updater\` varchar(18) DEFAULT NULL,
    \`status_reason\` varchar(1024) DEFAULT NULL,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `)

        for (const oldSuggestion of oldSuggestions) {
            // skip test suggestions
            if (oldSuggestion.id < 342) continue
            const { messageID } = oldSuggestion
            const message: Discord.Message = await suggestionsChannel.messages
                .fetch(messageID, { force: true })
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
            const title = description.match(/\*\*(.+)\*\*\n/)?.[1] || ""
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
            queryRunner.query(
                `
INSERT INTO suggestions
    (number, extends, author, anonymous, title, body, teams, status_updater, status_reason, message, staff, created_at, deleted_at, deleter)
VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    number,
                    _extends,
                    author,
                    anonymous,
                    title,
                    body,
                    teams,
                    statusUpdater,
                    statusReason,
                    _message,
                    staff,
                    createdAt,
                    deletedAt,
                    deleter
                ]
            )
        }

        await queryRunner.query("DROP TABLE old_suggestions")
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
