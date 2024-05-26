//@ts-check
const guild = "704929831246233681"
const person = "771484586513137674"
async function e () {
    const Discord = require("discord.js")
    const fs = require("fs")
    
    const token = fs.readFileSync("config/token.txt", {encoding: "utf-8"})
    
    const client = new Discord.Client({intents: [
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.GuildMembers,
        Discord.IntentsBitField.Flags.GuildBans,
        Discord.IntentsBitField.Flags.GuildEmojisAndStickers,
        Discord.IntentsBitField.Flags.GuildIntegrations,
        Discord.IntentsBitField.Flags.GuildWebhooks,
        Discord.IntentsBitField.Flags.GuildInvites,
        Discord.IntentsBitField.Flags.MessageContent,
        Discord.IntentsBitField.Flags.GuildVoiceStates,
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.GuildMessageReactions,
        Discord.IntentsBitField.Flags.DirectMessages,
        Discord.IntentsBitField.Flags.DirectMessageReactions
    ],})

    await client.login(token)

    const guildReal = await client.guilds.fetch(guild);
    console.log("e")
    const meme = await guildReal.members.fetch(person);
    console.log("e")
    await meme.ban({deleteMessageSeconds:0, reason: "Bozo"});
    console.log("e")
    
    

}

e()