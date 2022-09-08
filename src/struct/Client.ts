import typeorm from "typeorm"
import Discord from "discord.js"
import EventList from "./client/EventList.js"
import CommandList from "./client/CommandList.js"
import ConfigManager from "./client/ConfigManager.js"
import createLogger = require("@buildtheearth/bot-logger")
import ActionLog from "../entities/ActionLog.entity.js"
import Snippet from "../entities/Snippet.entity.js"
import GuildManager from "./discord/GuildManager.js"
import Response from "./discord/Response.js"
import WebserverHandler from "./client/WebserverHandler.js"
import BannedWord, { bannedTypes } from "../entities/BannedWord.entity.js"
import BannedWordFilter from "./client/BannedWordFilter.js"
import DutyScheduler from "./client/DutyScheduler.js"
import Messages from "./client/Messages.js"
import PlaceholderHandler from "./client/PlaceholderHandler.js"
import Placeholder from "../entities/Placeholder.entity.js"
import { hexToNum } from "@buildtheearth/bot-utils"
import path from "path"
import url from "url"
import { Cron } from "croner"
import ModalList from "./client/ModalList.js"
import InteractionInfo from "../typings/InteractionInfo.js"
import { Database } from "better-sqlite3"

export default class Client extends Discord.Client {
    declare guilds: Discord.GuildManager
    customGuilds = new GuildManager(this)
    db: typeorm.Connection | null = null
    // @ts-ignore weird issues with call signatures
    logger = createLogger({
        filePath: path.dirname(url.fileURLToPath(import.meta.url)) + "/../../logs/"
    })
    config = new ConfigManager(this)
    events = new EventList(this)
    modals = new ModalList(this)
    commands = new CommandList(this)
    aliases = new Discord.Collection()
    response = new Response(this)
    webserver = new WebserverHandler(this)
    filterWordsCached: { banned: bannedTypes; except: Array<string> } = {
        banned: new Map<string, BannedWord>(),
        except: new Array<string>()
    }

    punishmentTimeouts: Map<string, { mute: Cron | null; ban: Cron | null }> = new Map()
    honorBuilderTimeouts: Map<string, Cron> = new Map()
    reminderTimeouts: Map<number, Cron> = new Map()
    bannerCycleTimeout: Cron | null = null
    filter = new BannedWordFilter(this)
    dutyScheduler = new DutyScheduler(this)
    messages = new Messages(this)
    placeholder = new PlaceholderHandler(this)
    deletedMessages = new WeakSet<Discord.Message>()
    roles: Record<string, string[]> = {}
    interactionInfo: Map<string, InteractionInfo> = new Map()

    async initDatabase(): Promise<void> {
        const db = this.config.database
        const options: Partial<typeorm.ConnectionOptions> = {
            type: db.type,
            timezone: "+00:00",
            entities: [
                path.dirname(url.fileURLToPath(import.meta.url)) +
                    "/../entities/*.{js,ts}"
            ],
            synchronize: true, //process.env.NODE_ENV !== "production",
            //TODO: Fix this after db updates
            logging: "all" //process.env.NODE_ENV !== "production" ? "all" : false
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
                database: db.path,
                type: "better-sqlite3",
                prepareDatabase: (data: unknown) => {
                    const typedData = data as Database
                    typedData.function("FIND_IN_SET", (find: string, list: string) => {
                        if (find === null || list === null) {
                            return null
                        }
                        const listArray = list.split(",")
                        const index = listArray.indexOf(find)
                        if (index === -1) {
                            return 0
                        }
                        return index + 1
                    })
                }
            })
        }

        this.db = await typeorm.createConnection(options as typeorm.ConnectionOptions) // non-Partial

        if (["mariadb", "mysql"].includes(db.type)) {
            await this.db.query("SET NAMES utf8mb4")
            await this.db.query("SET collation_connection = utf8mb4_general_ci")
            await this.db.query("SET @@collation_connection = utf8mb4_general_ci")
            await this.db.query("SET @@collation_database = utf8mb4_general_ci")
            await this.db.query("SET @@collation_server = utf8mb4_general_ci")
        } else if (db.type === "sqlite") {
            await this.db.query("PRAGMA encoding = 'UTF-8'")
        }

        this.filterWordsCached = await BannedWord.loadWords()
        this.placeholder.cache = await Placeholder.loadPlaceholders()
    }

    login(): Promise<string> {
        return super.login(this.config.token)
    }

    async log(
        log: ActionLog | Snippet | Placeholder | Discord.APIEmbed,
        action?: "add" | "edit" | "delete",
        executor?: Discord.User
    ): Promise<void> {
        const channel: Discord.TextChannel | null = (await this.channels
            .fetch(
                log instanceof Snippet || log instanceof Placeholder
                    ? this.config.logging.snippetLogs
                    : this.config.logging.modLogs,
                { force: true }
            )
            .catch(() => null)) as Discord.TextChannel | null
        if (!channel) return

        if (log instanceof ActionLog) {
            const embed = await log.displayEmbed(this)
            if (embed.author && embed.color === hexToNum(this.config.colors.error)) {
                delete embed.description
                embed.author.name += " deleted"
            } else if (embed.color === hexToNum(this.config.colors.success)) {
                embed.color = hexToNum(this.config.colors.info)
            }

            await channel.send({ embeds: [embed] })
        } else if (log instanceof Snippet || log instanceof Placeholder) {
            const embed = log.displayEmbed(this)
            if (executor)
                embed.thumbnail = {
                    url: executor.displayAvatarURL({
                        extension: "png",
                        forceStatic: false,
                        size: 64
                    })
                }
            if (embed.author)
                switch (action) {
                    case "add":
                        embed.author.name += " created"
                        break
                    case "edit":
                        embed.author.name += " edited"
                        embed.color = hexToNum(this.config.colors.info)
                        break
                    case "delete":
                        embed.author.name += " deleted"
                        embed.color = hexToNum(this.config.colors.error)
                        break
                }
            await channel.send({ embeds: [embed] })
        } else {
            await channel.send({ embeds: [log] })
        }
    }
}
