import { loadSyncJSON5 } from "@buildtheearth/bot-utils"
import url from "url"
import path from "path"
import fs from "fs"
import Client from "../struct/Client.js"

export function loadRoles(client: Client): Record<string, string[]> {
    const roles: Record<string, string[]> = {}
    const mainPath = path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            `/../../config/extensions/roles/${client.config.guilds.main}.json5`
    )
    const staffPath = path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            `/../../config/extensions/roles/${client.config.guilds.staff}.json5`
    )

    if (fs.existsSync(mainPath)) {
        const main = loadSyncJSON5(mainPath)
        for (const key of Object.keys(main)) {
            if (roles[key] !== undefined) {
                roles[key] = [...roles[key], main[key]]
            } else {
                roles[key] = [main[key]]
            }
        }
    }

    if (fs.existsSync(staffPath)) {
        const staff = loadSyncJSON5(mainPath)
        for (const key of Object.keys(staff)) {
            if (roles[key] !== undefined) {
                roles[key] = [...roles[key], staff[key]]
            } else {
                roles[key] = [staff[key]]
            }
        }
    }

    return new Proxy(
        {},
        {
            get: (target: unknown, key: string): string[] =>
                roles[key] || ["000000000000000000"]
        }
    ) as Record<string, string[]>
}
