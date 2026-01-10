import { Controller, Get, Post, Param, Req, Res, Body } from "@nestjs/common"
import Discord from "discord.js"
import { Response, Request } from "express"
import { loadSyncJSON5, noop } from "@buildtheearth/bot-utils"
import path from "path"
import url from "url"
import fs from "fs"

interface RoleMapping {
    main?: string
    staff?: string
}

type RoleWhitelist = Record<string, RoleMapping>

@Controller("/api/v1/role")
export default class RoleController {
    private getRoleWhitelist(): RoleWhitelist {
        const configPath = path.join(
            path.dirname(url.fileURLToPath(import.meta.url)),
            "../../../../../config/extensions/allowedRolesToAdd.json5"
        )
        
        if (!fs.existsSync(configPath)) {
            return {}
        }
        
        try {
            const whitelist = loadSyncJSON5(configPath)
            return typeof whitelist === "object" && whitelist !== null && !Array.isArray(whitelist) 
                ? whitelist 
                : {}
        } catch (error) {
            globalThis.client.logger.error(
                `Failed to load allowedRolesToAdd.json5: ${error}`
            )
            return {}
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

        // Get role whitelist
        const whitelist = this.getRoleWhitelist()
        
        if (Object.keys(whitelist).length === 0) {
            return res.status(503).send({
                error: "SERVICE_UNAVAILABLE",
                message: "Role whitelist is not configured or empty"
            })
        }

        // Validate that all requested role keys are in the whitelist
        const invalidRoles = roles.filter(roleKey => !whitelist[roleKey])
        if (invalidRoles.length > 0) {
            return res.status(403).send({
                error: "FORBIDDEN",
                message: "One or more role keys are not allowed to be modified",
                invalidRoles
            })
        }

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
            const mapping = whitelist[roleKey]
            
            // Process main guild role
            if (mapping.main && mainUser) {
                try {
                    if (add) {
                        await mainUser.roles.add(mapping.main)
                    } else {
                        await mainUser.roles.remove(mapping.main)
                    }
                    results.main.success.push(roleKey)
                } catch (error) {
                    results.main.failure.push({
                        roleKey,
                        error: error instanceof Error ? error.message : "Unknown error"
                    })
                }
            }
            
            // Process staff guild role
            if (mapping.staff && staffUser) {
                try {
                    if (add) {
                        await staffUser.roles.add(mapping.staff)
                    } else {
                        await staffUser.roles.remove(mapping.staff)
                    }
                    results.staff.success.push(roleKey)
                } catch (error) {
                    results.staff.failure.push({
                        roleKey,
                        error: error instanceof Error ? error.message : "Unknown error"
                    })
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
