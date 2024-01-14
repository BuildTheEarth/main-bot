import Client from "../struct/Client.js"
import Command from "../struct/Command.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Args from "../struct/Args.js"
import fetch from "node-fetch"
import CommandMessage from "../struct/CommandMessage.js"
import Discord, { ChannelType } from "discord.js"
import {
    currentEnv,
    formatPunishmentTime,
    hexToNum,
    formatTimestamp,
    loadSyncJSON5
} from "@buildtheearth/bot-utils"
import ActionLog from "../entities/ActionLog.entity.js"
import { warn } from "console"

const packageJson = loadSyncJSON5("package.json")
export default new Command({
    name: "info",
    aliases: [],
    description: "Get info about the server or bot!",
    permission: globalThis.client.roles.ANY,
    subcommands: [
        {
            name: "bot",
            description: "Get info about the bot!"
        },
        {
            name: "server",
            description: "Get info about the server!"
        },
        {
            name: "moderation",
            description: "Get info about moderation!"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(["bot", "server", "moderation"])

        if (subcommand === "bot" || !subcommand) {
            const response = (await (
                await fetch(
                    "https://api.github.com/repos/buildtheearth/main-bot/git/refs/heads/main"
                )
            ).json()) as { object: { url: string } }
            const commit = (await (await fetch(response.object.url)).json()) as {
                committer: { name: string }
                message: string
                html_url: string
            }
            const embed = <Discord.APIEmbed>{
                title: "Info about main-bot",
                thumbnail: { url: client.user?.displayAvatarURL() },
                fields: [
                    { name: "Environment", value: currentEnv() },
                    { name: "Version", value: packageJson.version },
                    {
                        name: "Uptime",
                        value: formatPunishmentTime(
                            Math.floor(process.uptime()) * 1000,
                            true
                        )
                    },
                    {
                        name: "Latest Commit",
                        value: `**[${commit.committer.name}](https://github.com/${commit.committer.name})** - [\`${commit.message}\`](${commit.html_url})`
                    }
                ],
                color: hexToNum(client.config.colors.info),
                description:
                    "**[Github repo](https://github.com/BuildtheEarth/main-bot) | [Bug report](https://github.com/BuildTheEarth/main-bot/issues/new?template=bug_report.md)**"
            }

            await message.send({ embeds: [embed] })
        }

        if (subcommand === "server") {
            const guild = message.guild

            const embed = <Discord.APIEmbed>{
                title: "Server Info",
                thumbnail: { url: guild.iconURL() },
                fields: [
                    { name: "Members", value: `${guild.memberCount}`, inline: true },
                    { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
                    {
                        name: "Boosts",
                        value: `${guild.premiumSubscriptionCount} (Tier ${guild.premiumTier})`,
                        inline: true
                    },
                    {
                        name: "Categories",
                        value: `${
                            guild.channels.cache.filter(
                                c => c.type === ChannelType.GuildCategory
                            ).size
                        }`,
                        inline: true
                    },
                    {
                        name: "Text Channels",
                        value: `${
                            guild.channels.cache.filter(
                                c => c.type === ChannelType.GuildText
                            ).size
                        }`,
                        inline: true
                    },
                    {
                        name: "Voice Channels",
                        value: `${
                            guild.channels.cache.filter(
                                c => c.type === ChannelType.GuildVoice
                            ).size
                        }`,
                        inline: true
                    },
                    {
                        name: "Owner",
                        value: `<@${guild.ownerId}>`,
                        inline: true
                    },
                    {
                        name: "Created At",
                        value: formatTimestamp(guild.createdAt, "f"),
                        inline: true
                    }
                ],
                color: hexToNum(client.config.colors.info),
                footer: { text: `${guild.id}` }
            }
            await message.send({ embeds: [embed] })
        }
        if (subcommand === "moderation") {
            const guild = message.guild

            const banCount = await ActionLog.count({ where: {action: "ban"} })
            const muteCount = await ActionLog.count({ where: {action: "mute"} })
            const kickCount = await ActionLog.count({ where: {action: "kick"} })
            const warnCount = await ActionLog.count({ where: {action: "warn"} })
            const unmuteCount = await ActionLog.count({ where: {action: "unmute"} })
            const unbanCount = await ActionLog.count({ where: {action: "unban"} })
            const val = await ActionLog.query("SELECT member, occurs FROM (SELECT member,count(*) as occurs FROM action_logs GROUP BY `member` LIMIT 1) T1")
            const embed = <Discord.APIEmbed>{
                title: "Moderation Info",
                thumbnail: { url: guild.iconURL() },
                fields: [
                    { name: "Total Cases", value: `${banCount+muteCount+kickCount+warnCount-unmuteCount-unbanCount}`, inline: true },
                    { name: "Bans", value: `${banCount-unbanCount}`, inline: true },
                    { name: "Kicks", value: `${kickCount}`, inline: true },
                    { name: "Warns", value: `${warnCount}`, inline: true },
                    { name: "Mutes", value: `${muteCount-unmuteCount}`, inline: true },
                    { name: "Mutes", value: `${muteCount-unmuteCount}`, inline: true },
                    { name: "Member With Most Cases", value: `<@${val[0].member}>`, inline: true },
                ],
                color: hexToNum(client.config.colors.info),
            }
            await message.send({ embeds: [embed] })
        }
    }
})
