import fs from "fs"
import Discord from "discord.js"
import Client from "./struct/Client"
import GuildMember from "./struct/GuildMember"

Discord.Structures.extend("GuildMember", () => GuildMember)
const client = new Client()

async function main() {
    const commands = await fs.promises.readdir("./commands")
    console.log(`Loading ${commands.length} commands...`)
    commands.forEach(command => {
        client.loadCommand(command)
    })

    const events = await fs.promises.readdir("./events")
    console.log(`Loading ${events.length} events...`)
    events.forEach(event => {
        const name = event.replace(/\.js$/, "")
        const handler = require(`./events/${name}`)
        client.on(name, handler.bind(null, client))
    })

    client.config.permLevels.forEach(level => {
        client.levelCache[level.name] = level.level
    })

    await client.login(client.config.token)
    console.log("Logged in!")
}

main()
