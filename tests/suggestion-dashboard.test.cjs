const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")
const vm = require("node:vm")
const ts = require("typescript")
const discord = require("discord.js")

function loadDashboard() {
    const file = path.join(__dirname, "../src/struct/client/SuggestionDashboard.ts")
    const exports = {}
    const saved = []
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022
        }
    }).outputText
    const dependencies = {
        "discord.js": discord,
        "@buildtheearth/bot-utils": {
            formatTimestamp: date => date.toISOString(),
            truncateString: (value, length) => value.slice(0, length)
        },
        "../discord/BotGuildMember.js": {
            default: { hasRole: member => member.publisher === true }
        },
        "../../util/discordEpoch.js": { discordEpoch: date => date.toISOString() },
        "crypto": require("node:crypto"),
        "croner": {},
        "../../entities/Suggestion.entity.js": { default: {} },
        "../../entities/SuggestionDashboardPost.entity.js": {
            default: { getRepository: () => ({ save: async post => saved.push(post) }) }
        },
        "../../util/suggestionDashboard.util.js": {
            DASHBOARD_STATUSES: { all: "All statuses" },
            validateFilters: () => {},
            discordDateRange: () => "Previous week"
        }
    }
    vm.runInNewContext(
        code,
        {
            exports,
            require: name => {
                assert.ok(name in dependencies, `Unexpected import: ${name}`)
                return dependencies[name]
            }
        },
        { filename: file }
    )
    const client = {
        config: {
            guilds: { main: "main", staff: "staff" },
            suggestionDashboard: {
                enabled: true,
                channels: { main: "692251560981430292", staff: "705286174356537394" },
                mainAccessRoleId: "691343715117039666"
            }
        },
        roles: { ADMIN: "admin", MANAGER: "manager" },
        logger: { error: () => {} }
    }
    return { dashboard: new exports.default(client), client, saved }
}

function interaction(guildId, roles = []) {
    return { guildId, member: { roles }, user: { id: "user" } }
}

test("Staff is open to all members; Main requires the exact Builder+ role", () => {
    const { dashboard } = loadDashboard()
    assert.equal(dashboard.canUseDashboard(interaction("staff")), true)
    assert.equal(dashboard.canUseDashboard(interaction("main")), false)
    assert.equal(dashboard.canUseDashboard(interaction("main", ["admin"])), false)
    assert.equal(
        dashboard.canUseDashboard(interaction("main", ["691343715117039666"])),
        true
    )
    assert.equal(
        dashboard.canUseDashboard(interaction("other", ["691343715117039666"])),
        false
    )
    assert.equal(dashboard.canUseDashboard({ guildId: null, member: null }), false)
    const member = Object.create(discord.GuildMember.prototype)
    member._roles = ["691343715117039666"]
    member.guild = {
        roles: {
            cache: new discord.Collection([
                ["691343715117039666", { id: "691343715117039666" }]
            ])
        }
    }
    assert.equal(dashboard.canUseDashboard({ ...interaction("main"), member }), true)
})

test("Main cannot view or select Staff data; publication remains restricted", () => {
    const { dashboard } = loadDashboard()
    assert.equal(dashboard.canViewStaffSuggestions(interaction("main")), false)
    assert.equal(dashboard.canViewStaffSuggestions(interaction("staff")), true)
    const [, session] = dashboard.createSession("user", "main", false)
    assert.equal(session.source, "main")
    assert.throws(
        () => dashboard.applyFilterSelection("source", "all", session),
        /restricted/
    )
    assert.throws(
        () => dashboard.applyFilterSelection("source", "staff", session),
        /restricted/
    )
    assert.equal(dashboard.canUseDashboard(interaction("staff"), true), false)
    const publisher = Object.create(discord.GuildMember.prototype)
    publisher.publisher = true
    assert.equal(
        dashboard.canUseDashboard({ ...interaction("staff"), member: publisher }, true),
        true
    )
    assert.equal(
        dashboard.canUseDashboard({ ...interaction("main"), member: publisher }, true),
        false
    )
})

test("Every component interaction rechecks access after Builder+ is removed", async () => {
    const { dashboard } = loadDashboard()
    const [, session] = dashboard.createSession("user", "main", false)
    let reply
    const result = await dashboard.handleInteraction({
        ...interaction("main"),
        customId: "sugd:open",
        isButton: () => true,
        reply: async payload => {
            reply = payload
        }
    })
    assert.equal(result, true)
    assert.match(reply.content, /access/)
    assert.equal(reply.flags, discord.MessageFlags.Ephemeral)
    assert.equal(session.source, "main")
})

test("Weekly posts scope Main totals and persist a separate key for each channel", async () => {
    const { dashboard, client, saved } = loadDashboard()
    const payloads = []
    const sources = []
    dashboard.getPublicationChannel = async source => ({
        id: client.config.suggestionDashboard.channels[source],
        send: async payload => {
            payloads.push(payload)
            return { id: source, url: `https://discord.com/${source}` }
        }
    })
    dashboard.findExistingPublication = async () => undefined
    dashboard.createSuggestionQuery = filters => {
        sources.push(filters.source)
        return { getCount: async () => (filters.source === "main" ? 2 : 5) }
    }
    const period = { from: "2026-09-28", to: "2026-10-04", monday: "2026-10-05" }
    await dashboard.publishToChannel("main", period)
    await dashboard.publishToChannel("staff", period)
    assert.deepEqual(sources, ["main", "all"])
    assert.match(
        payloads[0].embeds[0].data.description,
        /2 new suggestions\*\* from Main\n/
    )
    assert.doesNotMatch(payloads[0].embeds[0].data.description, /Staff/)
    assert.match(
        payloads[1].embeds[0].data.description,
        /5 new suggestions\*\* from Main and Staff/
    )
    assert.equal(saved[0].key, "692251560981430292:2026-10-05")
    assert.equal(saved[1].key, "705286174356537394:2026-10-05")
    dashboard.findExistingPublication = async () => ({ url: "existing" })
    assert.equal(await dashboard.publishToChannel("main", period), "existing")
    assert.equal(payloads.length, 2)
})

test("A failed channel does not prevent the other server's weekly post", async () => {
    const { dashboard } = loadDashboard()
    const attempted = []
    dashboard.publishToChannel = async source => {
        attempted.push(source)
        if (source === "main") throw new Error("Missing permission")
        return "https://discord.com/staff"
    }
    assert.equal(await dashboard.publishWeeklyOverview(), "https://discord.com/staff")
    assert.deepEqual(attempted, ["main", "staff"])
    assert.equal(dashboard.publishing, false)
})
