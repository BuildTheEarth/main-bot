import Discord from "discord.js";
import Client from "../struct/Client.js";
import { noop } from "@buildtheearth/bot-utils";

export default async function languageDropdown(client: Client, interaction: Discord.StringSelectMenuInteraction): Promise<any> {
    const roles = interaction.values.map((e) => e.replace("language.", ""))

    const languageRoles = [
        "696121533663281205",
        "696123149606977628",
        "696123325344251995",
        "696123331673587742",
        "696123338774544475",
        "696123339063820329",
        "696123339990892584",
        "696123340468781136",
        "696139193029492757",
    ]

    const member = await client.customGuilds.main().members.fetch(interaction.user).catch(noop)

    if (!member) return await interaction.reply("Unknown Error")

    const currRoles = member.roles.cache.filter((e) => languageRoles.includes(e.id)).map((e) => e.id)

    for (const role of currRoles) {
        if (!roles.includes(role)) await member.roles.remove(role)
    }

    for (const role of roles) {
        if (!currRoles.includes(role)) await member.roles.add(role)
    }

    return await interaction.reply({content: "Roles have been given!", ephemeral: true})
}