import { loadSyncJSON5, noop } from "@buildtheearth/bot-utils"
import url from "url"
import path from "path"
import fs from "fs"
import BotClient from "../struct/BotClient.js"
import { Role } from "discord.js"

interface RoleData {
    tag: string
    id: string
    roles?: { name: string; id: string }[]
    joinDate?: number
}

export function loadRoles(client: BotClient): Record<string, string[]> {
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
        const staff = loadSyncJSON5(staffPath)
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

export async function fetchPeopleByRoles(
    client: BotClient,
    roles: string[],
    extended: boolean
): Promise<Map<string, RoleData[]>> {
    const roleData = new Map<string, RoleData[]>()
    for (const role of roles) {
        const roleString = role.toString()

        let roleObj: Role | null

        roleObj = await client.customGuilds.main().roles.fetch(roleString).catch(noop)

        if (!roleObj)
            roleObj = await client.customGuilds
                .staff()
                .roles.fetch(roleString)
                .catch(noop)

        if (!roleObj) roleData.set(role, [])
        else {
            await roleObj.guild.members.fetch()
            let members: RoleData[]

            if (extended) {
                members = roleObj.members.map(e => {
                    return {
                        tag: e.user.tag,
                        id: e.id,
                        joinDate: e.joinedTimestamp || 0,
                        roles: e.roles.cache
                            .sort((a, b) => b.position - a.position)
                            .map(role => {
                                return { name: role.name, id: role.id }
                            })
                            .filter(role => role.name !== "@everyone")
                    }
                })
            } else {
                members = roleObj.members.map(e => {
                    return {
                        tag: e.user.tag,
                        id: e.id
                    }
                })
            }

            roleData.set(role, members)
        }
    }

    return roleData
}
