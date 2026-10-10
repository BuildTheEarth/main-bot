import {
    GuildMember,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Interaction,
    ButtonInteraction,
    StringSelectMenuInteraction,
    ModalSubmitInteraction,
    MessageFlags,
    ModalBuilder,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
    escapeMarkdown
} from "discord.js"
import { formatTimestamp, truncateString } from "@buildtheearth/bot-utils"
import BotGuildMember from "../discord/BotGuildMember.js"
import { discordEpoch } from "../../util/discordEpoch.js"
import { randomUUID } from "crypto"
import { Cron } from "croner"
import type BotClient from "../BotClient.js"
import Suggestion from "../../entities/Suggestion.entity.js"
import SuggestionDashboardPost from "../../entities/SuggestionDashboardPost.entity.js"
import {
    DASHBOARD_STATUSES,
    DashboardFilters,
    validateFilters,
    discordDateRange
} from "../../util/suggestionDashboard.util.js"

interface Session extends DashboardFilters {
    guildId: string
    canViewStaff: boolean
    owner: string
    page: number
    expires: number
    period: string
    busy: boolean
}

const PAGE_SIZE = 5
const SESSION_TTL = 30 * 60 * 1000
const PREFIX = "sugd:"
const periods: Record<string, string> = {
    "all": "All dates",
    "week": "Previous calendar week",
    "7": "Last 7 days",
    "30": "Last 30 days",
    "90": "Last 90 days",
    "custom": "Custom date range"
}
function escapeSuggestionText(text: string, length: number): string {
    return truncateString(escapeMarkdown(text).replace(/@/g, "@\u200b"), length)
}

function selectRow(
    id: string,
    action: string,
    placeholder: string,
    options: Record<string, string>,
    selected: string
) {
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`${PREFIX}${id}:${action}`)
            .setPlaceholder(placeholder)
            .addOptions(
                Object.entries(options).map(([value, label]) => ({
                    label,
                    value,
                    default: value === selected
                }))
            )
    )
}

function button(
    id: string,
    action: string,
    label: string,
    disabled = false,
    style = ButtonStyle.Secondary
) {
    return new ButtonBuilder()
        .setCustomId(`${PREFIX}${id}:${action}`)
        .setLabel(label)
        .setStyle(style)
        .setDisabled(disabled)
}

function inputRow(
    name: string,
    label: string,
    value: string,
    placeholder: string,
    length = 10
) {
    return new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
            .setCustomId(name)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(length)
            .setPlaceholder(placeholder)
            .setValue(value)
    )
}

export default class SuggestionDashboard {
    private sessions = new Map<string, Session>()
    private job?: Cron
    private publishing = false

    constructor(private client: BotClient) {}

    private canViewStaffSuggestions(interaction: Interaction): boolean {
        return (
            interaction.guildId === this.client.config.guilds.staff &&
            !!interaction.member
        )
    }

    private canUseDashboard(interaction: Interaction, publish = false): boolean {
        if (!interaction.member) return false
        const member =
            interaction.member instanceof GuildMember
                ? interaction.member
                : interaction.guild?.members.cache.get(interaction.user.id)
        if (publish) {
            return (
                this.canViewStaffSuggestions(interaction) &&
                !!member &&
                BotGuildMember.hasRole(
                    member,
                    [this.client.roles.ADMIN, this.client.roles.MANAGER],
                    this.client
                )
            )
        }
        if (interaction.guildId === this.client.config.guilds.staff) return true
        if (interaction.guildId !== this.client.config.guilds.main) return false
        const roleId = this.client.config.suggestionDashboard?.mainAccessRoleId
        if (!roleId) return false
        return interaction.member instanceof GuildMember
            ? interaction.member.roles.cache.has(roleId)
            : interaction.member.roles.includes(roleId)
    }

    private getConfigurationError(): string | null {
        const config = this.client.config.suggestionDashboard
        if (
            !config?.enabled ||
            !config.channels?.main ||
            !config.channels.staff ||
            !config.mainAccessRoleId
        )
            return "The suggestion dashboard is not configured yet. Ask an Admin to set it up."
        return null
    }

    async openDashboard(
        interaction: ChatInputCommandInteraction,
        publish = false
    ): Promise<void> {
        const error = this.getConfigurationError()
        if (error || !this.canUseDashboard(interaction, publish)) {
            await interaction.reply({
                content:
                    error ||
                    "The Main dashboard requires Builder+. Staff members can use the Staff dashboard. Publishing is restricted to Staff Admins and Managers.",
                flags: MessageFlags.Ephemeral
            })
            return
        }
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        try {
            if (publish) {
                const messageUrl = await this.publishWeeklyOverview()
                await interaction.editReply({
                    content: messageUrl
                        ? `The weekly menu is ready: ${messageUrl}`
                        : "The weekly update is already being processed. Please try again shortly."
                })
            } else {
                const [id, session] = this.createSession(
                    interaction.user.id,
                    interaction.guildId || "",
                    this.canViewStaffSuggestions(interaction)
                )
                await interaction.editReply(await this.renderSession(id, session))
            }
        } catch (error) {
            this.client.logger.error(`Suggestion dashboard: ${String(error)}`)
            await interaction.editReply({
                content:
                    "The dashboard could not be loaded. Ask an Admin to check the database and bot channel permissions.",
                embeds: [],
                components: []
            })
        }
    }

    private createSession(
        owner: string,
        guildId: string,
        canViewStaff: boolean
    ): [string, Session] {
        this.removeExpiredSessions()
        const oldest = this.sessions.keys().next().value
        if (this.sessions.size >= 1000 && oldest) this.sessions.delete(oldest)
        const id = randomUUID().slice(0, 12)
        const session: Session = {
            guildId,
            canViewStaff,
            owner,
            page: 0,
            expires: Date.now() + SESSION_TTL,
            period: "all",
            query: "",
            status: "all",
            source: canViewStaff ? "all" : "main",
            from: "",
            to: "",
            busy: false
        }
        this.sessions.set(id, session)
        return [id, session]
    }

    private removeExpiredSessions(): void {
        for (const [id, session] of this.sessions) {
            if (session.expires < Date.now()) this.sessions.delete(id)
        }
    }

    private getWeeklyPeriod(now: Date) {
        const monday = new Date(now)
        monday.setUTCHours(0, 0, 0, 0)
        monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
        const from = new Date(monday)
        from.setUTCDate(from.getUTCDate() - 7)
        const to = new Date(monday)
        to.setUTCDate(to.getUTCDate() - 1)
        return {
            from: discordEpoch(from).slice(0, 10),
            to: discordEpoch(to).slice(0, 10),
            monday: discordEpoch(monday).slice(0, 10)
        }
    }

    private setDatePeriod(session: Session, period: string): void {
        const now = new Date()
        session.period = period
        session.from = ""
        session.to = ""
        if (period === "week") {
            const { from, to } = this.getWeeklyPeriod(now)
            session.from = from
            session.to = to
        }
        if (["7", "30", "90"].includes(period)) {
            session.to = discordEpoch(now).slice(0, 10)
            now.setUTCDate(now.getUTCDate() - (Number(period) - 1))
            session.from = discordEpoch(now).slice(0, 10)
        }
        session.page = 0
    }

    private createSuggestionQuery(filters: DashboardFilters) {
        validateFilters(filters)
        const query = Suggestion.getRepository().createQueryBuilder("s")
        if (filters.query) {
            const search = filters.query
                .toLowerCase()
                .replace(/[!%_]/g, char => `!${char}`)
            query.andWhere(
                "(LOWER(s.title) LIKE :query ESCAPE '!' OR LOWER(s.body) LIKE :query ESCAPE '!')",
                { query: `%${search}%` }
            )
        }
        if (filters.status === "open") {
            query.andWhere("(s.status IS NULL OR s.status = '' OR s.status = 'open')")
        } else if (filters.status !== "all") {
            query.andWhere("s.status = :status", { status: filters.status })
        }
        if (filters.source !== "all")
            query.andWhere("s.staff = :staff", { staff: filters.source === "staff" })
        if (filters.from)
            query.andWhere("s.created_at >= :from", {
                from: new Date(filters.from)
            })
        if (filters.to) {
            const until = new Date(filters.to)
            until.setUTCDate(until.getUTCDate() + 1)
            query.andWhere("s.created_at < :until", { until })
        }
        return query.orderBy("s.created_at", "DESC").addOrderBy("s.id", "DESC")
    }

    private async renderSession(id: string, session: Session) {
        if (!session.canViewStaff) session.source = "main"
        const query = this.createSuggestionQuery(session)
        const total = await query.getCount()
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
        session.page = Math.max(0, Math.min(pages - 1, session.page))
        const rows = await query
            .skip(session.page * PAGE_SIZE)
            .take(PAGE_SIZE)
            .getMany()
        const range = discordDateRange(session)
        const search = session.query
            ? `Search: **${escapeSuggestionText(session.query, 200)}**`
            : "Newest suggestions first."
        const page = `Page ${session.page + 1}/${pages}`
        const footer = `${page} · Only visible to you · Session expires after 30 minutes of inactivity`
        const heading = `**${total} suggestions** · ${DASHBOARD_STATUSES[session.status]}`
        const embed = new EmbedBuilder()
            .setColor(0x728b62)
            .setTitle(
                session.canViewStaff
                    ? "Suggestion dashboard · Main & Staff"
                    : "Suggestion dashboard · Main"
            )
            .setDescription([heading, range, search].join("\n"))
            .setFooter({ text: footer })
        for (const suggestion of rows) {
            const number = suggestion.number ?? `${suggestion.extends} (follow-up)`
            const source = suggestion.staff ? "Staff" : "Main"
            const status =
                DASHBOARD_STATUSES[suggestion.status || "open"] || suggestion.status
            const title = escapeSuggestionText(suggestion.title, 190)
            const body = escapeSuggestionText(suggestion.body, 350) || "No description."
            const date = formatTimestamp(suggestion.createdAt)
            const link = `[Open in Discord](${suggestion.getURL(this.client)})`
            embed.addFields({
                name: truncateString(`${source} #${number} · ${title}`, 256),
                value: `${body}\n**${status}** · ${date} · ${link}`
            })
        }
        if (!rows.length)
            embed.addFields({
                name: "No suggestions found",
                value: "Adjust your filters or select Reset. Deleted suggestions are not shown."
            })
        return {
            content: "",
            embeds: [embed],
            components: [
                selectRow(id, "status", "Status", DASHBOARD_STATUSES, session.status),
                selectRow(id, "period", "Date", periods, session.period),
                selectRow(
                    id,
                    "source",
                    "Server",
                    session.canViewStaff
                        ? { all: "Main + Staff", main: "Main only", staff: "Staff only" }
                        : { main: "Main only" },
                    session.source
                ),
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    button(id, "previous", "← Previous", session.page === 0),
                    button(id, "next", "Next →", session.page >= pages - 1),
                    button(id, "search", "Search / dates", false, ButtonStyle.Primary),
                    button(id, "reset", "Reset"),
                    button(id, "refresh", "Refresh")
                )
            ],
            allowedMentions: { parse: [] as [] }
        }
    }

    private buildSearchModal(id: string, session: Session) {
        return new ModalBuilder()
            .setCustomId(`${PREFIX}${id}:filters`)
            .setTitle("Search and filter suggestions")
            .addComponents(
                inputRow(
                    "query",
                    "Search title and description",
                    session.query,
                    "Search text",
                    200
                ),
                inputRow("from", "From (inclusive)", session.from, "YYYY-MM-DD"),
                inputRow("to", "To (inclusive)", session.to, "YYYY-MM-DD")
            )
    }

    async handleInteraction(interaction: Interaction): Promise<boolean> {
        if (
            !(
                interaction.isButton() ||
                interaction.isStringSelectMenu() ||
                interaction.isModalSubmit()
            ) ||
            !interaction.customId.startsWith(PREFIX)
        )
            return false
        try {
            const error = this.getConfigurationError()
            if (error || !this.canUseDashboard(interaction)) {
                await interaction.reply({
                    content: error || "You do not have access to this dashboard.",
                    flags: MessageFlags.Ephemeral
                })
                return true
            }
            this.removeExpiredSessions()
            const [, id, action, end] = interaction.customId.split(":")
            if (interaction.isButton() && (id === "open" || id === "week")) {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral })
                const [key, session] = this.createSession(
                    interaction.user.id,
                    interaction.guildId || "",
                    this.canViewStaffSuggestions(interaction)
                )
                if (id === "week") {
                    session.from = action
                    session.to = end
                    session.period = "custom"
                    validateFilters(session)
                }
                await interaction.editReply(await this.renderSession(key, session))
                return true
            }
            const session = this.sessions.get(id)
            if (
                !session ||
                session.owner !== interaction.user.id ||
                session.guildId !== interaction.guildId
            ) {
                await interaction.reply({
                    content:
                        "This menu has expired, the bot has restarted, or the menu belongs to someone else. Open a new menu from the weekly post or /suggestion-dashboard.",
                    flags: MessageFlags.Ephemeral
                })
                return true
            }
            if (session.busy) {
                await interaction.reply({
                    content:
                        "Your previous selection is still being processed. Please try again shortly.",
                    flags: MessageFlags.Ephemeral
                })
                return true
            }
            session.canViewStaff = this.canViewStaffSuggestions(interaction)
            if (!session.canViewStaff) session.source = "main"
            session.expires = Date.now() + SESSION_TTL
            if (
                (interaction.isButton() && action === "search") ||
                (interaction.isStringSelectMenu() &&
                    action === "period" &&
                    interaction.values[0] === "custom")
            ) {
                await interaction.showModal(this.buildSearchModal(id, session))
                return true
            }
            await this.updateSession(interaction, id, action, session)
        } catch (error) {
            this.client.logger.error(`Suggestion dashboard interaction: ${String(error)}`)
            const content =
                "Could not load suggestions. Try again or open /suggestion-dashboard."
            if (interaction.deferred || interaction.replied)
                await interaction
                    .followUp({ content, flags: MessageFlags.Ephemeral })
                    .catch(() => null)
            else
                await interaction
                    .reply({ content, flags: MessageFlags.Ephemeral })
                    .catch(() => null)
        }
        return true
    }

    private async updateSession(
        interaction:
            | ButtonInteraction
            | StringSelectMenuInteraction
            | ModalSubmitInteraction,
        id: string,
        action: string,
        session: Session
    ): Promise<void> {
        session.busy = true
        try {
            const next = { ...session }
            if (interaction.isModalSubmit()) {
                if (!(await this.readSearchForm(interaction, action, next, session)))
                    return
            } else {
                await interaction.deferUpdate()
                this.applySessionAction(interaction, action, next)
            }
            await interaction.editReply(await this.renderSession(id, next))
            Object.assign(session, next)
        } finally {
            session.busy = false
        }
    }

    private async readSearchForm(
        interaction: ModalSubmitInteraction,
        action: string,
        next: Session,
        current: Session
    ): Promise<boolean> {
        try {
            if (action !== "filters") throw new Error("Invalid form.")
            next.query = interaction.fields.getTextInputValue("query").trim()
            next.from = interaction.fields.getTextInputValue("from").trim()
            next.to = interaction.fields.getTextInputValue("to").trim()
            next.period = next.from || next.to ? "custom" : "all"
            next.page = 0
            validateFilters(next)
            if (
                next.from === current.from &&
                next.to === current.to &&
                current.period !== "custom"
            )
                this.setDatePeriod(next, current.period)
        } catch (error) {
            await interaction.reply({
                content: (error as Error).message,
                flags: MessageFlags.Ephemeral
            })
            return false
        }
        if (interaction.isFromMessage()) await interaction.deferUpdate()
        else await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        return true
    }

    private applySessionAction(
        interaction: ButtonInteraction | StringSelectMenuInteraction,
        action: string,
        next: Session
    ): void {
        if (interaction.isStringSelectMenu()) {
            this.applyFilterSelection(action, interaction.values[0], next)
            return
        }
        switch (action) {
            case "previous":
                next.page--
                break
            case "next":
                next.page++
                break
            case "reset":
                next.query = ""
                next.status = "all"
                next.source = next.canViewStaff ? "all" : "main"
                this.setDatePeriod(next, "all")
                break
            case "refresh":
                break
            default:
                throw new Error("Invalid action.")
        }
    }

    private applyFilterSelection(action: string, value: string, next: Session): void {
        switch (action) {
            case "status":
                next.status = value
                break
            case "source":
                if (!next.canViewStaff && value !== "main")
                    throw new Error("Staff suggestions are restricted.")
                next.source = value as Session["source"]
                break
            case "period":
                if (!Object.hasOwn(periods, value) || value === "custom")
                    throw new Error("Invalid period.")
                this.setDatePeriod(next, value)
                break
            default:
                throw new Error("Invalid filter.")
        }
        validateFilters(next)
        next.page = 0
    }

    async startWeeklyPublishing(): Promise<void> {
        this.job?.stop()
        if (this.getConfigurationError()) return

        const publish = async () => {
            try {
                await this.publishWeeklyOverview()
            } catch (error) {
                this.client.logger.error(
                    `Suggestion dashboard weekly post: ${String(error)}`
                )
            }
        }
        this.job = new Cron("0 9 * * 1", { timezone: "UTC" }, publish)
        await publish()
    }

    private async getPublicationChannel(source: "main" | "staff"): Promise<TextChannel> {
        const config = this.client.config.suggestionDashboard
        if (!config?.enabled) throw new Error("The suggestion dashboard is not enabled.")
        const channel = await this.client.channels.fetch(config.channels[source])
        if (
            !(channel instanceof TextChannel) ||
            channel.guild.id !== this.client.config.guilds[source]
        )
            throw new Error(
                `Configure a text channel in the ${source} guild for suggestionDashboard.channels.${source}.`
            )
        const user = this.client.user
        if (!user) throw new Error("The bot is not ready.")
        const permissions = channel.permissionsFor(user)
        if (
            !permissions?.has([
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.ReadMessageHistory
            ])
        )
            throw new Error(
                "Dashboard channel requires View Channel, Send Messages, Embed Links and Read Message History."
            )

        return channel
    }

    private async findExistingPublication(
        channel: TextChannel,
        key: string,
        marker: string
    ) {
        const stored = await SuggestionDashboardPost.findOne({ key })
        if (stored) {
            try {
                return await channel.messages.fetch(stored.messageId)
            } catch (error) {
                if ((error as { code?: number }).code !== 10008) throw error
            }
        }
        const recent = await channel.messages.fetch({ limit: 100 })
        const recovered = recent.find(
            message =>
                message.author.id === this.client.user?.id &&
                message.embeds.some(embed => embed.footer?.text === marker)
        )
        if (recovered)
            await SuggestionDashboardPost.getRepository().save({
                key,
                messageId: recovered.id
            })
        return recovered
    }

    async publishWeeklyOverview(): Promise<string | null> {
        if (this.publishing) return null
        this.publishing = true
        try {
            const now = new Date()
            let period = this.getWeeklyPeriod(now)
            const scheduled = new Date(period.monday)
            scheduled.setUTCHours(9)
            if (now < scheduled) {
                now.setUTCDate(now.getUTCDate() - 7)
                period = this.getWeeklyPeriod(now)
            }
            const urls: string[] = []
            for (const source of ["main", "staff"] as const) {
                try {
                    urls.push(await this.publishToChannel(source, period))
                } catch (error) {
                    this.client.logger.error(
                        `Suggestion dashboard ${source} weekly post: ${String(error)}`
                    )
                }
            }
            if (!urls.length) throw new Error("Could not publish either weekly overview.")
            return urls.join("\n")
        } finally {
            this.publishing = false
        }
    }

    private async publishToChannel(
        source: "main" | "staff",
        period: ReturnType<SuggestionDashboard["getWeeklyPeriod"]>
    ): Promise<string> {
        const channel = await this.getPublicationChannel(source)
        const key = `${channel.id}:${period.monday}`
        const marker = `suggestion-dashboard:${key}`
        const existing = await this.findExistingPublication(channel, key, marker)
        if (existing) return existing.url
        const filters = {
            query: "",
            status: "all",
            source: source === "staff" ? ("all" as const) : ("main" as const),
            from: period.from,
            to: period.to
        }
        const total = await this.createSuggestionQuery(filters).getCount()
        const range = discordDateRange(period)
        const description =
            "Open the weekly overview or search all suggestions. Your menu and search results are only visible to you."
        const embed = new EmbedBuilder()
            .setColor(0x728b62)
            .setTitle("Suggestions · weekly overview")
            .setDescription(
                `**${total} new suggestions** from ${
                    source === "staff" ? "Main and Staff" : "Main"
                }\n${range}\n\n${description}`
            )
            .setFooter({ text: marker })
        const payload = {
            embeds: [embed],
            allowedMentions: { parse: [] as [] },
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${PREFIX}week:${period.from}:${period.to}`)
                        .setLabel("Browse previous week")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`${PREFIX}open`)
                        .setLabel("All suggestions / search")
                        .setStyle(ButtonStyle.Secondary)
                )
            ]
        }
        const message = await channel.send(payload)
        await SuggestionDashboardPost.getRepository().save({
            key,
            messageId: message.id
        })
        return message.url
    }
}
