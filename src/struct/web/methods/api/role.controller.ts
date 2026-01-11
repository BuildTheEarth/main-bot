import { Controller, Get, Post, Param, Req, Res, Body } from "@nestjs/common"
import Discord from "discord.js"
import { Response, Request } from "express"
import { loadSyncJSON5, noop } from "@buildtheearth/bot-utils"
import path from "path"
import url from "url"
import fs from "fs"

@Controller("/api/v1/role")
export default class RoleController {
    private getAllowedRoleKeys(): string[] {
        const configPath = path.join(
            path.dirname(url.fileURLToPath(import.meta.url)),
            "../../../../../config/extensions/allowedRolesToSync.json5"
        )
        
        if (!fs.existsSync(configPath)) {
            return []
        }
        
        try {
            const whitelist = loadSyncJSON5(configPath)
            return Array.isArray(whitelist) ? whitelist : []
        } catch (error) {
            globalThis.client.logger.error(
                `Failed to load allowedRolesToSync.json5: ${error}`
            )
            return []
        }
    }

    @Get(":id")
    async roleGet(
        @Req() req: Request,
        @Res() res: Response,
        @Param("id") id: string
    ): Promise<unknown> {
        res.type("application/json")
        if (!id) {
            return res.status(400).send({
                error: "MISSING_PARAMETER",
                message: "Missing parameter: id"
            })
        }

        const userList = typeof id === "string" ? id : null // we need to add proper multi-user support later

        if (!userList) {
            return res.status(400).send({
                error: "INVALID_PARAMETER",
                message: "Invalid parameter: id"
            })
        }

        let user: Discord.GuildMember

        try {
            user = await globalThis.client.customGuilds
                .main()
                .members.fetch({ user: userList })
        } catch {
            return res
                .status(404)
                .send({ error: "NOT_FOUND", message: "Not found: user" })
        }

        if (!user) {
            return res
                .status(404)
                .send({ error: "NOT_FOUND", message: "Not found: user" })
        }

        await user.fetch()

        const userInfo = {
            id: user.id,
            roles: user.roles.cache.map(v => {
                return { name: v.name, id: v.id }
            })
        }

        res.status(200).send(userInfo)

        return
    }

    @Post(":id")
    async builderPost(
        @Req() req: Request,
        @Res() res: Response,
        @Param("id") id: string,
        @Body("add") add: boolean,
        @Body("roles") roles: string[]
    ): Promise<unknown> {
        res.type("application/json")
        
        // Validate required parameters
        if (!id) {
            return res.status(400).send({
                error: "MISSING_PARAMETER",
                message: "Missing parameter: id"
            })
        }

        if (typeof add !== "boolean") {
            return res.status(400).send({
                error: "MISSING_PARAMETER",
                message: "Missing parameter: add (boolean)"
            })
        }

        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).send({
                error: "MISSING_PARAMETER",
                message: "Missing parameter: roles (array of role keys)"
            })
        }

        // Get allowed role keys from whitelist
        const allowedKeys = this.getAllowedRoleKeys()
        
        if (allowedKeys.length === 0) {
            return res.status(503).send({
                error: "SERVICE_UNAVAILABLE",
                message: "Role sync whitelist is not configured or empty"
            })
        }

        // Validate that all requested role keys are in the whitelist
        const invalidRoles = roles.filter(roleKey => !allowedKeys.includes(roleKey))
        if (invalidRoles.length > 0) {
            return res.status(403).send({
                error: "FORBIDDEN",
                message: "One or more role keys are not allowed to be synced",
                invalidRoles
            })
        }

        // Use role mappings already loaded in the client
        const roleMappings = globalThis.client.roles

        // Fetch the user from both guilds
        const mainGuild = globalThis.client.customGuilds.main()
        const staffGuild = globalThis.client.customGuilds.staff()
        
        let mainUser: Discord.GuildMember | null = null
        let staffUser: Discord.GuildMember | null = null
        
        try {
            mainUser = await mainGuild.members.fetch({ user: id }).catch(noop)
        } catch {
            // User not in main guild
        }
        
        try {
            staffUser = await staffGuild.members.fetch({ user: id }).catch(noop)
        } catch {
            // User not in staff guild
        }

        if (!mainUser && !staffUser) {
            return res.status(404).send({
                error: "NOT_FOUND",
                message: "User not found in any guild"
            })
        }

        // Process role changes for each guild
        const results = {
            main: {
                success: [] as string[],
                failure: [] as Array<{ roleKey: string; error: string }>
            },
            staff: {
                success: [] as string[],
                failure: [] as Array<{ roleKey: string; error: string }>
            }
        }

        for (const roleKey of roles) {
            // Get role IDs for this key from the role mappings already loaded in client
            // The client.roles contains an array of role IDs for each key
            const roleIds = roleMappings[roleKey]
            
            if (!roleIds || roleIds.length === 0) {
                // Role key not found in mappings
                results.main.failure.push({
                    roleKey,
                    error: "Role key not found in role mappings"
                })
                results.staff.failure.push({
                    roleKey,
                    error: "Role key not found in role mappings"
                })
                continue
            }

            // client.roles contains an array of role IDs for each key
            // We need to determine which role ID belongs to which guild
            for (const roleId of roleIds) {
                // Check if this role exists in main guild
                if (mainUser) {
                    const mainRole = mainGuild.roles.cache.get(roleId)
                    if (mainRole) {
                        try {
                            if (add) {
                                await mainUser.roles.add(roleId)
                            } else {
                                await mainUser.roles.remove(roleId)
                            }
                            if (!results.main.success.includes(roleKey)) {
                                results.main.success.push(roleKey)
                            }
                        } catch (error) {
                            if (!results.main.failure.some(f => f.roleKey === roleKey)) {
                                results.main.failure.push({
                                    roleKey,
                                    error: error instanceof Error ? error.message : "Unknown error"
                                })
                            }
                        }
                    }
                }
                
                // Check if this role exists in staff guild
                if (staffUser) {
                    const staffRole = staffGuild.roles.cache.get(roleId)
                    if (staffRole) {
                        try {
                            if (add) {
                                await staffUser.roles.add(roleId)
                            } else {
                                await staffUser.roles.remove(roleId)
                            }
                            if (!results.staff.success.includes(roleKey)) {
                                results.staff.success.push(roleKey)
                            }
                        } catch (error) {
                            if (!results.staff.failure.some(f => f.roleKey === roleKey)) {
                                results.staff.failure.push({
                                    roleKey,
                                    error: error instanceof Error ? error.message : "Unknown error"
                                })
                            }
                        }
                    }
                }
            }
        }

        return res.status(200).send({
            userId: id,
            operation: add ? "add" : "remove",
            results
        })
    }
}
