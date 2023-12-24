import "reflect-metadata"
import Discord from "discord.js"
import Client from "./struct/Client.js"
import { loadRoles } from "./util/roles.util.js"

declare global {
    // eslint-disable-next-line no-var
    var client: Client
    // eslint-disable-next-line no-var
    var fileExtension: string
}

const client = new Client({
    intents: [
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
    ],
    partials: [
        Discord.Partials.Channel,
        Discord.Partials.Message,
        Discord.Partials.Reaction
    ]
})
global.client = client

globalThis.client = client

async function main() {
    client.logger.debug("Loading config...")
    await client.config.load()
    client.roles = loadRoles(client)
    client.logger.info("Loaded config.")

    client.logger.debug("Connecting to database...")
    await client.initDatabase()
    client.logger.info("Connected to database.")

    client.logger.debug("Registering events...")
    await client.events.load()
    client.events.register()
    client.logger.info("Registered events.")

    client.logger.debug("Registering webserver...")
    await client.webserver.load()
    client.logger.info("Registered webserver.")

    client.logger.debug("Registering web events...")
    await client.webEvents.load()
    client.logger.info("Registered web events.")

    client.logger.debug("Registering modals..")
    await client.modals.load()
    client.logger.info("Registered modals.")

    client.logger.debug("Registering assets..")
    await client.assets.load()
    client.logger.info("Registered assets.")

    client.logger.debug("Logging in to Discord...")
    await client.login()
    client.logger.info("Logged in to Discord.")

    //moved command loading to ready
}

globalThis.fileExtension = "js"

global.fileExtension = "js"

main()

process.on("uncaughtException", (error: Error) => {
    client.logger.error(error.stack)
    setTimeout(() => process.exit(1), 100)
})

process.on("unhandledRejection", (error: Error) => {
    client.logger.error(`(Unhandled Rejection) ${error.stack}`)
    setTimeout(() => process.exit(1), 100)
})
