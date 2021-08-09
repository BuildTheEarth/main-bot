import "reflect-metadata"
import Discord from "discord.js"
import Client from "./struct/Client"

const client = new Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_WEBHOOKS,
        Discord.Intents.FLAGS.GUILD_PRESENCES,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ],
    partials: ["CHANNEL"]
})

async function main() {
    client.logger.debug("Loading config...")
    await client.config.load()
    client.logger.info("Loaded config.")

    client.logger.debug("Loading commands...")
    await client.commands.load()
    client.logger.info("Loaded commands.")

    client.logger.debug("Registering events...")
    await client.events.load()
    client.events.register()
    client.logger.info("Registered events.")

    client.logger.debug("Connecting to database...")
    await client.initDatabase()
    client.logger.info("Connected to database.")

    client.logger.debug("Logging in to Discord...")
    await client.login()
    client.logger.info("Logged in to Discord.")
}

main()

process.on("uncaughtException", (error: Error) => {
    client.logger.error(error.stack)
    setTimeout(() => process.exit(1), 100)
})

process.on("unhandledRejection", (error: Error) => {
    client.logger.error(`(Unhandled Rejection) ${error.stack}`)
    setTimeout(() => process.exit(1), 100)
})
