import sql from "../modules/sql"
import util from "util"
import config from "../../config"
import Discord from "discord.js"
import EventList from "./EventList"
import CommandList from "./CommandList"
import createLogger from "@buildtheearth/bot-logger"

export default class Client /**/ extends Discord.Client {
    sql = sql
    logger = createLogger()
    config = config
    events = new EventList(this)
    commands = new CommandList()
    aliases = new Discord.Collection()
    levelCache = {}

    get prefix() {
        return this.config.prefix
    }

    async clean(client: this, text: any) {
        if (text && text.constructor.name == "Promise") text = await text
        if (typeof text !== "string") text = require("util").inspect(text, { depth: 1 })

        text = text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203))
            .replace(this.token, "why u tryna steal token")

        return text
    }
}
