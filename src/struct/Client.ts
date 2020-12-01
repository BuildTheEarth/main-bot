import Discord from "discord.js"
import EventList from "./client/EventList"
import CommandList from "./client/CommandList"
import ConfigManager from "./client/ConfigManager"
import createLogger from "@buildtheearth/bot-logger"

export default class Client /**/ extends Discord.Client {
    logger = createLogger()
    config = new ConfigManager()
    events = new EventList(this)
    commands = new CommandList()
    aliases = new Discord.Collection()
}
