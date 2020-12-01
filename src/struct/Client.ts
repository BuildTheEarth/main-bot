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

    // may God have mercy upon our poor souls
    async loadCommand(commandName) {
        try {
            console.log(`Loading Command: ${commandName}`)
            const props = require(`../commands/${commandName}`)
            if (props.init) props.init(this)
            this.commands.set(props.conf.name, props)
            props.conf.aliases.forEach(alias => this.aliases.set(alias, props.conf.name))
        } catch (e) {
            return `Unable to load command ${commandName}: ${e}`
        }
    }

    // todo: remove deprecated .parent
    async unloadCommand(commandName: string) {
        let command
        if (this.commands.has(commandName)) {
            command = this.commands.get(commandName)
        } else if (this.aliases.has(commandName)) {
            command = this.commands.get(this.aliases.get(commandName))
        }
        if (!command)
            return `The command \`${commandName}\` doesn"t seem to exist, nor is it an alias. Try again!`

        if (command.shutdown) {
            await command.shutdown(this)
        }
        const mod = require.cache[require.resolve(`../commands/${command.conf.name}`)]
        delete require.cache[require.resolve(`../commands/${command.conf.name}.js`)]
        for (let i = 0; i < mod.parent.children.length; i++) {
            if (mod.parent.children[i] === mod) {
                mod.parent.children.splice(i, 1)
                break
            }
        }
        return false
    }
}
