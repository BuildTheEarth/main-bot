const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const test = require("node:test")
const vm = require("node:vm")
const ts = require("typescript")
const discord = require("discord.js")

async function submit({ parent, extension = null, existing = [] }) {
    const lookups = []
    let saved
    let reply
    class Suggestion {
        static parseIdentifier() {
            return { number: 42, extension }
        }
        static async findOne(where) {
            lookups.push(where)
            return parent
        }
        static async find(options) {
            lookups.push(options.where)
            return existing
        }
        async displayEmbed() {
            return {}
        }
        async save() {
            saved = this
        }
    }
    const dependencies = {
        "../entities/Suggestion.entity.js": { default: Suggestion },
        "@buildtheearth/bot-utils": { truncateString: value => value },
        "../typings/InteractionInfo.js": { isSuggestInfo: () => true },
        "discord.js": discord
    }
    const file = path.join(__dirname, "../src/modals/suggest.modal.ts")
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022
        }
    }).outputText
    const exports = {}
    vm.runInNewContext(
        code,
        { exports, require: name => dependencies[name] },
        { filename: file }
    )
    const info = new Map([
        ["modal", { anon: false, subsuggestion: `42${extension || ""}` }]
    ])
    const interaction = {
        customId: "modal",
        guild: { id: "staff" },
        channel: { id: "staff-channel" },
        user: { id: "author" },
        fields: { getTextInputValue: field => (field === "teams" ? "" : field) },
        deferReply: async () => {
            interaction.deferred = true
        },
        editReply: async payload => {
            reply = payload.content
        }
    }
    const client = {
        config: {
            guilds: { main: "main", staff: "staff" },
            suggestions: { main: "main-channel", staff: "staff-channel" },
            emojis: { upvote: "👍", downvote: "👎" }
        },
        interactionInfo: info,
        messages: { getMessage: key => key },
        logger: { error: error => assert.fail(error) },
        channels: {
            cache: new Map([
                [
                    "staff-channel",
                    {
                        send: async () => ({ id: "message", react: async () => {} })
                    }
                ]
            ])
        }
    }
    await exports.default(interaction, client)
    return { lookups, saved, reply, info }
}

test("Follow-up parents are looked up within the submitting server", async () => {
    const result = await submit({ parent: undefined })
    assert.equal(result.lookups[0].staff, true)
    assert.equal(result.lookups[0].number, 42)
    assert.match(result.reply, /doesn't exist/)
    assert.equal(result.saved, undefined)
    assert.equal(result.info.size, 0)
})

test("An unrelated follow-up does not block submission; missing parent threads still allow saving", async () => {
    const result = await submit({
        parent: {},
        extension: "c",
        existing: [{ getIdentifier: async () => "42b" }]
    })
    assert.equal(result.lookups[1].staff, true)
    assert.equal(result.saved.staff, true)
    assert.equal(result.saved.extends, 42)
    assert.equal(result.reply, "Suggestion created!")
    assert.equal(result.info.size, 0)
})

test("An existing follow-up identifier is rejected before posting", async () => {
    const result = await submit({
        parent: {},
        extension: "b",
        existing: [{ getIdentifier: async () => "42b" }]
    })
    assert.equal(result.reply, "alreadyExistsSubsuggestion")
    assert.equal(result.saved, undefined)
    assert.equal(result.info.size, 0)
})
