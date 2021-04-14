import { ConnectionOptions, Connection, createConnection } from "typeorm"
import Discord from "discord.js"
import GuildManager from "./discord/GuildManager"
import TextChannel from "./discord/TextChannel"
import EventList from "./client/EventList"
import CommandList from "./client/CommandList"
import ConfigManager from "./client/ConfigManager"
import createLogger from "@buildtheearth/bot-logger"
import ActionLog from "../entities/ActionLog"
import Snippet from "../entities/Snippet"

export default class Client extends Discord.Client {
    guilds: GuildManager = new GuildManager(this)
    db: Connection
    logger = createLogger({ filePath: __dirname + "/../../logs/" })
    config = new ConfigManager(this)
    events = new EventList(this)
    commands = new CommandList()
    aliases = new Discord.Collection()

    async initDatabase(): Promise<void> {
        const db = this.config.database
        const options: Partial<ConnectionOptions> = {
            type: db.type,
            entities: [__dirname + "/../entities/*.js"],
            synchronize: process.env.NODE_ENV !== "production"
        }

        if (!["mariadb", "mysql", "sqlite"].includes(db.type)) {
            this.logger.error("Only MariaDB, MySQL, and SQLite databases are supported.")
            process.exit(1)
        }

        if (["mariadb", "mysql"].includes(db.type)) {
            Object.assign(options, {
                host: db.host,
                database: db.name,
                username: db.user,
                password: db.pass
            })
        } else if (db.type === "sqlite") {
            Object.assign(options, {
                database: db.path
            })
        }

        this.db = await createConnection(options as ConnectionOptions) // non-Partial
    }

    login(): Promise<string> {
        return super.login(this.config.token)
    }

    async log(
        log: ActionLog | Snippet | Discord.MessageEmbedOptions,
        action?: "add" | "edit" | "delete",
        executor?: Discord.User
    ): Promise<void> {
        const channel: TextChannel = await this.channels
            .fetch(
                log instanceof Snippet
                    ? this.config.logging.snippetLogs
                    : this.config.logging.modLogs,
                true
            )
            .catch(() => null)
        if (!channel) return

        if (log instanceof ActionLog) {
            const embed = log.displayEmbed(this)
            if (embed.color === this.config.colors.error) {
                delete embed.description
                embed.author.name += " deleted"
            } else if (embed.color === this.config.colors.success) {
                embed.color = this.config.colors.info
            }

            await channel.send({ embed })
        } else if (log instanceof Snippet) {
            const embed = log.displayEmbed(this)
            embed.thumbnail = {
                url: executor.displayAvatarURL({ format: "png", dynamic: true, size: 64 })
            }

            switch (action) {
                case "add":
                    embed.author.name += " created"
                    break
                case "edit":
                    embed.author.name += " edited"
                    embed.color = this.config.colors.info
                    break
                case "delete":
                    embed.author.name += " deleted"
                    embed.color = this.config.colors.error
                    break
            }
            await channel.send({ embed })
        } else {
            await channel.send({ embed: log })
        }
    }
}
