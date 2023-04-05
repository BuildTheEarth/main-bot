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
    
    const channel = await client.channels.fetch("715369975035985970")
    
    if (!channel || !channel.isTextBased()) process.exit(0)
    const data =     new Discord.ActionRowBuilder({
        components: [
            new Discord.StringSelectMenuBuilder().setCustomId("info.languages").setPlaceholder("Select a Language").setMinValues(1).setMaxValues(9).addOptions(...[
                new Discord.StringSelectMenuOptionBuilder().setLabel("Français").setValue("language.696121533663281205").setEmoji("🇫🇷"),
                new Discord.StringSelectMenuOptionBuilder().setLabel("Deutsch").setValue("language.696123149606977628").setEmoji("🇩🇪"),
                new Discord.StringSelectMenuOptionBuilder().setLabel("Español").setValue("language.696123325344251995").setEmoji("🇪🇸"),
                new Discord.StringSelectMenuOptionBuilder().setLabel("English").setValue("language.696123331673587742").setEmoji("🇬🇧"),
                new Discord.StringSelectMenuOptionBuilder().setLabel("Português").setValue("language.696123338774544475").setEmoji("🇵🇹"),
                new Discord.StringSelectMenuOptionBuilder().setLabel("Italiano").setValue("language.696123339063820329").setEmoji("🇮🇹"),
                new Discord.StringSelectMenuOptionBuilder().setLabel("Pусский").setValue("language.696123339990892584").setEmoji("🇷🇺"),
                new Discord.StringSelectMenuOptionBuilder().setLabel("中文").setValue("language.696123340468781136").setEmoji("🇨🇳"),
                new Discord.StringSelectMenuOptionBuilder().setLabel("International").setValue("language.696139193029492757").setEmoji("🌐").setDescription("Select this if you speak a language that is not listed here!"),
            ])
        ]
    })
    await channel.send({components:[
        data
    ]})
}

e()