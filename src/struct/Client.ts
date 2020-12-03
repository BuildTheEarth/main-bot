import { Connection, createConnection } from "typeorm"
import Discord from "discord.js"
import EventList from "./client/EventList"
import CommandList from "./client/CommandList"
import ConfigManager from "./client/ConfigManager"
import createLogger from "@buildtheearth/bot-logger"

export default class Client extends Discord.Client {
    db: Connection
    logger = createLogger({ filePath: __dirname + "/../../logs/" })
    config = new ConfigManager(this)
    events = new EventList(this)
    commands = new CommandList()
    aliases = new Discord.Collection()

    async initDatabase() {
        const db = this.config.database
        this.db = await createConnection({
            type: "mysql",
            host: db.host,
            database: db.name,
            username: db.user,
            password: db.pass,
            entities: [__dirname + "/../entities/*.js"],
            synchronize: true
        })
    }

    login(): Promise<string> {
        return super.login(this.config.token)
    }
}
