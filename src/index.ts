import Discord from "discord.js"
import Client from "./struct/Client"
import GuildMember from "./struct/discord/GuildMember"
import Role from "./struct/discord/Role"

Discord.Structures.extend("GuildMember", () => GuildMember)
Discord.Structures.extend("Role", () => Role)
const client = new Client()

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
