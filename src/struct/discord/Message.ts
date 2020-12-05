import Discord from "discord.js"
import Guild from "./Guild"
import GuildMember from "./GuildMember"
import TextChannel from "./TextChannel"
import DMChannel from "./DMChannel"
import NewsChannel from "./NewsChannel"

export default class Message extends Discord.Message {
    guild: Guild
    member: GuildMember
    channel: TextChannel | DMChannel | NewsChannel
}
