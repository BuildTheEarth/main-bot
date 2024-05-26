

//@ts-check

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
    
    await client.user?.setAvatar("https://cdn.discordapp.com/icons/690908396404080650/a_d8a1c59ee4d172fa672266169f8aa1c0.gif")
}

e()