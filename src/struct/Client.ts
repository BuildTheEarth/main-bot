import sql from "../modules/sql"
import util from "util"
import config from "../../config"
import Discord from "discord.js"
import EventList from "./EventList"
import CommandList from "./CommandList"

export default class Client /**/ extends Discord.Client {
    sql = sql
    config = config
    events = new EventList(this)
    commands = new CommandList()
    aliases = new Discord.Collection()
    levelCache = {}

    get prefix() {
        return this.config.prefix
    }

    async permlevel(message: Discord.Message) {
        let permlvl = 0
        const permOrder = this.config.permLevels
            .slice(0)
            .sort((p, c) => (p.level < c.level ? 1 : -1))

        while (permOrder.length) {
            const currentLevel = permOrder.shift()
            if (message.guild && currentLevel.guildOnly) continue
            if (currentLevel.check(message)) {
                permlvl = currentLevel.level
                break
            }
        }
        return permlvl
    }

    // ???????????????????????????????????????????????
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
