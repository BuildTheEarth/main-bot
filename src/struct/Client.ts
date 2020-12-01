import config from "../../config"
import Discord from "discord.js"
import EventList from "./client/EventList"
import CommandList from "./client/CommandList"
import createLogger from "@buildtheearth/bot-logger"

export default class Client /**/ extends Discord.Client {
    logger = createLogger()
    config = config
    events = new EventList(this)
    commands = new CommandList()
    aliases = new Discord.Collection()
}
