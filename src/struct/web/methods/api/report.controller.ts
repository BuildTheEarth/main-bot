import { Controller, Get, Post, Param, Req, Res, Body } from "@nestjs/common"
import SuspiciousUser from "../../../../entities/SuspiciousUser.entity.js"
import { noop } from "@buildtheearth/bot-utils"
import { FastifyReply, FastifyRequest } from "fastify"
import { ServerResponse } from "http"

@Controller("/api/v1/report")
export default class ReportsController {
    @Get(":id")
    async reportGet(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply<ServerResponse>,
        @Param("id") id: string
    ): Promise<unknown> {
        res.type("application/json")
        const params = req.query
        const showDeleted = params["showDeleted"] ? true : false
        if (!id) {
            return res.send({
                error: "MISSING_PARAMETER",
                message: "Missing parameter: id"
            })
        }

        const userList = typeof id === "string" ? id : null

        if (!userList) {
            return res.send({
                error: "INVALID_PARAMETER",
                message: "Invalid parameter: id"
            })
        }

        const userRecords = await SuspiciousUser.findAndCount({
            where: { userId: userList },
            withDeleted: showDeleted,
            select: [
                "id",
                "userId",
                "submitterId",
                "denied",
                "approved",
                "reason",
                "evidence",
                "moderatorId"
            ]
        })

        if (userRecords[1] === 0) {
            return res.send({ error: "NO_RECORDS", message: "No records: user" })
        }

        const userRecordsReal = userRecords[0].map(record => {
            return {
                id: record.id,
                userId: record.userId,
                submitterId: record.submitterId,
                status: record.approved
                    ? "approved"
                    : record.denied
                    ? "denied"
                    : "pending",
                reason: record.reason,
                evidence: record.evidence,
                moderatorId: record.moderatorId
            }
        })

        res.send({
            id: userList,
            records: userRecordsReal
        })

        return
    }

    @Post(":id")
    async builderPost(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply<ServerResponse>,
        @Param("id") user: string,
        @Body("submitter") submitter: string,
        @Body("evidence") evidence: string
    ): Promise<unknown> {
        res.type("application/json")

        user = typeof user === "string" ? user : null // we need to add proper multi-user support later

        if (!user) {
            return res.send({
                error: "INVALID_PARAMETER",
                message: "Invalid parameter: user"
            })
        }

        submitter = typeof submitter === "string" ? submitter : null // we need to add proper multi-user support later

        if (!submitter) {
            return res.send({
                error: "INVALID_PARAMETER",
                message: "Invalid parameter: user"
            })
        }

        evidence = typeof evidence === "string" ? evidence : null

        if (!evidence) {
            return res.send({
                error: "INVALID_PARAMETER",
                message: "Invalid parameter: evidence"
            })
        }

        const guildMember = await globalThis.client.customGuilds
            .main()
            .members.fetch({ user: user })
            .catch(noop())

        if (!guildMember) {
            return res.send({ error: "NOT_FOUND", message: "Not found: user" })
        }

        const submitterMember = await globalThis.client.customGuilds
            .main()
            .members.fetch({ user: submitter })
            .catch(noop())

        if (!submitterMember) {
            return res.send({ error: "NOT_FOUND", message: "Not found: submitter" })
        }

        const suspiciousUser = await SuspiciousUser.createReport(
            globalThis.client,
            user,
            submitter,
            evidence
        )

        if (!suspiciousUser) {
            return res
                .status(500)
                .send({
                    error: "SERVER_ERROR",
                    message: "Creation Error: suspiciousUser"
                })
        }

        return res.send({
            id: suspiciousUser.id,
            userId: suspiciousUser.userId,
            submitterId: suspiciousUser.submitterId,
            status: suspiciousUser.approved
                ? "approved"
                : suspiciousUser.denied
                ? "denied"
                : "pending",
            reason: suspiciousUser.reason,
            evidence: suspiciousUser.evidence
        })
    }
}
