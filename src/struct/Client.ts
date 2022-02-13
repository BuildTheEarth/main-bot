import { ConnectionOptions, Connection, createConnection } from "typeorm"
import Discord, { Snowflake } from "discord.js"
import EventList from "./client/EventList"
import CommandList from "./client/CommandList"
import ConfigManager from "./client/ConfigManager"
import createLogger from "@buildtheearth/bot-logger"
import ActionLog from "../entities/ActionLog"
import Snippet from "../entities/Snippet"
import hexToRGB from "../util/hexToRGB"
import GuildManager from "./discord/GuildManager"
import Response from "./discord/Response"
import WebserverHandler from "./client/WebserverHandler"
import BannedWord, { bannedTypes } from "../entities/BannedWord"
import BannedWordFilter from "./client/BannedWordFilter"
import DutyScheduler from "./client/DutyScheduler"
import Messages from "./client/Messages"
import PlaceholderHandler from "./client/PlaceholderHandler"
import Placeholder from "../entities/Placeholder"

export default class Client extends Discord.Client {
    guilds: Discord.GuildManager
    customGuilds = new GuildManager(this)
    db: Connection
    logger = createLogger({ filePath: __dirname + "/../../logs/" })
    config = new ConfigManager(this)
    events = new EventList(this)
    commands = new CommandList(this)
    aliases = new Discord.Collection()
    response = new Response(this)
    webserver = new WebserverHandler(this)
    filterWordsCached: { banned: bannedTypes; except: Array<string> } = {
        banned: new Map<string, BannedWord>(),
        except: new Array<string>()
    }
    filter = new BannedWordFilter(this)
    dutyScheduler = new DutyScheduler(this)
    messages = new Messages(this).proxy
    placeholder = new PlaceholderHandler(this)
    deletedMessages = new WeakSet<Discord.Message>()

    async initDatabase(): Promise<void> {
        const db = this.config.database
        const options: Partial<ConnectionOptions> = {
            type: db.type,
            entities: [__dirname + "/../entities/*.{js,ts}"],
            synchronize: process.env.NODE_ENV !== "production",
            logging: process.env.NODE_ENV !== "production" ? "all" : false
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
        this.filterWordsCached = await BannedWord.loadWords()
        this.placeholder.cache = await Placeholder.loadPlaceholders()
    }

    login(): Promise<string> {
        return super.login(this.config.token)
    }

    async log(
        log: ActionLog | Snippet | Placeholder | Discord.MessageEmbedOptions,
        action?: "add" | "edit" | "delete",
        executor?: Discord.User
    ): Promise<void> {
        const channel: Discord.TextChannel = await this.channels
            .fetch(
                log instanceof Snippet || log instanceof Placeholder
                    ? this.config.logging.snippetLogs
                    : this.config.logging.modLogs,
                { force: true }
            )
            .catch(() => null)
        if (!channel) return

        if (log instanceof ActionLog) {
            const embed = await log.displayEmbed(this)
            if (embed.color === this.config.colors.error) {
                delete embed.description
                embed.author.name += " deleted"
            } else if (embed.color === this.config.colors.success) {
                embed.color = hexToRGB(this.config.colors.info)
            }

            await channel.send({ embeds: [embed] })
        } else if (log instanceof Snippet || log instanceof Placeholder) {
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
                    embed.color = hexToRGB(this.config.colors.info)
                    break
                case "delete":
                    embed.author.name += " deleted"
                    embed.color = hexToRGB(this.config.colors.error)
                    break
            }
            await channel.send({ embeds: [embed] })
        } else {
            await channel.send({ embeds: [log] })
        }
    }
}
