import { Gauge, register } from "prom-client"
import { Client } from "discord.js"
import express from "express"

// Initialize Prometheus gauge
const discordMembersGauge = new Gauge({
    name: "discord_members_total",
    help: "Total number of members in the Discord server",
    labelNames: ["guild_id", "guild_name"]
})

// Function to update members count gauge
async function updateMembersCount(client: Client) {
    try {
        const guild = await client.guilds.fetch("YOUR_GUILD_ID") // Replace with your Discord server ID
        const memberCount = guild.memberCount
        discordMembersGauge.labels(guild.id, guild.name).set(memberCount)
        console.log(
            `Updated member count for server ${guild.name} (${guild.id}): ${memberCount}`
        )
    } catch (error) {
        console.error("Error fetching guild information:", error)
    }
}

// Function to start updating members count periodically
export function startUpdatingMembersCount(client: Client) {
    setInterval(() => updateMembersCount(client), 5 * 60 * 1000)
}

// Initialize Express app
const app = express()

// Endpoint to expose metrics
app.get("/metrics", (req, res) => {
    res.set("Content-Type", register.contentType)
    res.end(register.metrics())
})

// Start the HTTP server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
