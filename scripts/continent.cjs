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
    
    const channel = await client.channels.fetch("808389633384906832")
    
    if (!channel || !channel.isTextBased()) process.exit(0)
    const data1 =     new Discord.ActionRowBuilder({
        components: [
            new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Secondary).setLabel("North America").setCustomId("info.teams.NA"),
            new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Secondary).setLabel("Latin America").setCustomId("info.teams.LA"),
            new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Secondary).setLabel("Europe").setCustomId("info.teams.EU"),
            new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Secondary).setLabel("Africa").setCustomId("info.teams.AF"),
            new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Secondary).setLabel("Asia").setCustomId("info.teams.AS"),
        ]
    })
    const data2 =     new Discord.ActionRowBuilder({
        components: [
            new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Secondary).setLabel("Oceania").setCustomId("info.teams.OC"),
            new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Secondary).setLabel("Other").setCustomId("info.teams.OT"),
        ]
    })
    await channel.send({
        "embeds": [
            {
              "title": "Build Teams",
              "description": "The Earth is split into multiple build teams each building a certain area. Click on the continent you'd like to build to continue.",
              "color": 5793266,
              "image": {
                "url": "https://i.imgur.com/PtoS6aI.png"
              }
            }
          ],
        components:[
        data1,
        data2

    ]})
}

e()