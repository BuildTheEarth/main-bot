import Args from "../struct/Args.js"
import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import BannerImage from "../entities/BannerImage.entity.js"
import ActionLog from "../entities/ActionLog.entity.js"
import ModerationNote from "../entities/ModerationNote.entity.js"
import ModpackImage from "../entities/ModpackImage.entity.js"
import Snippet from "../entities/Snippet.entity.js"
import Suggestion from "../entities/Suggestion.entity.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"

import CommandList from "../struct/client/CommandList.js"
import ConfigManager from "../struct/client/ConfigManager.js"
import EventList from "../struct/client/EventList.js"
import loadDir from "../util/loadDir.util.js"
import {
    flattenMarkdown,
    formatPunishmentTime,
    formatTimestamp,
    humanizeArray,
    humanizeConstant,
    isURL,
    noop,
    pastTense,
    stringifyAnything,
    truncateString
} from "@buildtheearth/bot-utils"
import languages from "../struct/client/iso6391.js"

import CommandMessage from "../struct/CommandMessage.js"

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ = { Args, Client, Command, BannerImage, ActionLog, ModerationNote, ModpackImage, Snippet, Suggestion, TimedPunishment, CommandList, ConfigManager, EventList, flattenMarkdown, formatPunishmentTime, formatTimestamp, humanizeArray, humanizeConstant, isURL, loadDir, noop, pastTense, languages, stringifyAnything, truncateString }

export default new Command({
    name: "eval",
    aliases: [],
    description: "Evaluate JavaScript code.",
    permission: globalThis.client.roles.BOT_DEVELOPER,
    devOnly: true,
    args: [
        {
            name: "code",
            description: "Code to run, JavaScript.",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const code = args.removeCodeblock(args.consumeRest(["code"]))
        await message.continue()

        try {
            const wrapped = code.includes("await") ? `(async () => {${code}})()` : code

            const tokenRegex = new RegExp(client.token, "g")
            const modpackRegex = new RegExp(client.config.modpackAuth, "g")
            const pwRegex = new RegExp(client.config.database.pass, "g")
            const out = stringifyAnything(await eval(wrapped))
                .replace(tokenRegex, "")
                .replace(modpackRegex, "")
                .replace(pwRegex, "")

            message.sendSuccess({
                author: { name: "Output" },
                description: `\`\`\`js\n${truncateString(out, 1990)}\n\`\`\``
            })
        } catch (error) {
            const err = `${error.name || "Error"}: ${error.message}`

            message.sendError({
                author: { name: "Error" },
                description: `\`\`\`${truncateString(err, 1994)}\`\`\``
            })
        }
    }
})
