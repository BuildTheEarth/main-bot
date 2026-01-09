import { Controller, Get, Post, Param, Req, Res, Body } from "@nestjs/common"
import Discord from "discord.js"
import { Response, Request } from "express"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"
import path from "path"
import url from "url"
import fs from "fs"

@Controller("/api/v1/role")
export default class RoleController {
    private getAllowedRoles(): string[] {
        const configPath = path.join(
            path.dirname(url.fileURLToPath(import.meta.url)),
            "../../../../../config/extensions/allowedRolesToAdd.json5"
        )
        
        if (!fs.existsSync(configPath)) {
            return []
        }
        
        try {
            const allowedRoles = loadSyncJSON5(configPath)
            return Array.isArray(allowedRoles) ? allowedRoles : []
        } catch (error) {
            globalThis.client.logger.error(
                `Failed to load allowedRolesToAdd.json5: ${error}`
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
                message: "Missing parameter: roles (array of role IDs)"
            })
        }

        // Get allowed roles from whitelist
        const allowedRoles = this.getAllowedRoles()
        
        if (allowedRoles.length === 0) {
            return res.status(503).send({
                error: "SERVICE_UNAVAILABLE",
                message: "Role whitelist is not configured or empty"
            })
        }

        // Validate that all requested roles are in the whitelist
        const invalidRoles = roles.filter(roleId => !allowedRoles.includes(roleId))
        if (invalidRoles.length > 0) {
            return res.status(403).send({
                error: "FORBIDDEN",
                message: "One or more roles are not allowed to be modified",
                invalidRoles
            })
        }

        // Fetch the user from the main guild
        let user: Discord.GuildMember
        try {
            user = await globalThis.client.customGuilds
                .main()
                .members.fetch({ user: id })
        } catch {
            return res.status(404).send({
                error: "NOT_FOUND",
                message: "Not found: user"
            })
        }

        if (!user) {
            return res.status(404).send({
                error: "NOT_FOUND",
                message: "Not found: user"
            })
        }

        // Process role changes
        const results = {
            success: [] as string[],
            failure: [] as Array<{ roleId: string; error: string }>
        }

        for (const roleId of roles) {
            try {
                if (add) {
                    // Add role
                    await user.roles.add(roleId)
                    results.success.push(roleId)
                } else {
                    // Remove role
                    await user.roles.remove(roleId)
                    results.success.push(roleId)
                }
            } catch (error) {
                results.failure.push({
                    roleId,
                    error: error instanceof Error ? error.message : "Unknown error"
                })
            }
        }

        return res.status(200).send({
            userId: user.id,
            operation: add ? "add" : "remove",
            results
        })
    }
}
