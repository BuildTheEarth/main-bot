import { Connection, createConnection } from "typeorm"
import Discord from "discord.js"
import TextChannel from "./discord/TextChannel"
import EventList from "./client/EventList"
import CommandList from "./client/CommandList"
import ConfigManager from "./client/ConfigManager"
import createLogger from "@buildtheearth/bot-logger"
import ActionLog from "../entities/ActionLog"
import Snippet from "../entities/Snippet"

export default class Client extends Discord.Client {
    db: Connection
    logger = createLogger({ filePath: __dirname + "/../../logs/" })
    config = new ConfigManager(this)
    events = new EventList(this)
    commands = new CommandList()
    aliases = new Discord.Collection()

    async initDatabase(): Promise<void> {
        const db = this.config.database
        this.db = await createConnection({
            type: "mysql",
            host: db.host,
            database: db.name,
            username: db.user,
            password: db.pass,
            entities: [__dirname + "/../entities/*.js"],
            synchronize: process.env.NODE_ENV !== "production"
        })
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
            .fetch(this.config.logs, true)
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
