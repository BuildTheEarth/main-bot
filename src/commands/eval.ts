import Args from "../struct/Args"
import Client from "../struct/Client"
import Command from "../struct/Command"

import BannerImage from "../entities/BannerImage"
import ActionLog from "../entities/ActionLog"
import ModerationNote from "../entities/ModerationNote"
import ModpackImage from "../entities/ModpackImage"
import Snippet from "../entities/Snippet"
import Suggestion from "../entities/Suggestion"
import TimedPunishment from "../entities/TimedPunishment"

import CommandList from "../struct/client/CommandList"
import ConfigManager from "../struct/client/ConfigManager"
import EventList from "../struct/client/EventList"

import flattenMarkdown from "../util/flattenMarkdown"
import formatPunishmentTime from "../util/formatPunishmentTime"
import formatTimestamp from "../util/formatTimestamp"
import humanizeArray from "../util/humanizeArray"
import humanizeConstant from "../util/humanizeConstant"
import isURL from "../util/isURL"
import loadDir from "../util/loadDir"
import noop from "../util/noop"
import pastTense from "../util/pastTense"
import languages from "../struct/client/iso6391"
import Roles from "../util/roles"
import stringifyAnything from "../util/stringifyAnything"
import truncateString from "../util/truncateString"
import CommandMessage from "../struct/CommandMessage"

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ = { Args, Client, Command, BannerImage, ActionLog, ModerationNote, ModpackImage, Snippet, Suggestion, TimedPunishment, CommandList, ConfigManager, EventList, flattenMarkdown, formatPunishmentTime, formatTimestamp, humanizeArray, humanizeConstant, isURL, loadDir, noop, pastTense, languages, Roles, stringifyAnything, truncateString }

export default new Command({
    name: "eval",
    aliases: [],
    description: "Evaluate JavaScript code.",
    permission: Roles.BOT_DEVELOPER,
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

            client.response.sendSuccess(message, {
                author: { name: "Output" },
                description: `\`\`\`js\n${truncateString(out, 1990)}\n\`\`\``
            })
        } catch (error) {
            const err = `${error.name || "Error"}: ${error.message}`

            client.response.sendError(message, {
                author: { name: "Error" },
                description: `\`\`\`${truncateString(err, 1994)}\`\`\``
            })
        }
    }
})
