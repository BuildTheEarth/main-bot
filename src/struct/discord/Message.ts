import Discord from "discord.js"
import Guild from "./Guild"
import GuildMember from "./GuildMember"
import TextChannel from "./TextChannel"

export default class Message extends Discord.Message {
    guild: Guild
    member: GuildMember
    channel: TextChannel | Discord.DMChannel | Discord.NewsChannel
}
