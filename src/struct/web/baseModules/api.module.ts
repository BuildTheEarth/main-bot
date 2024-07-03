import { Module } from "@nestjs/common"
import BuilderController from "../methods/api/builder.controller.js"
import PingController from "../methods/api/ping.controller.js"
import PunishController from "../methods/api/punish.controller.js"
import ReportsController from "../methods/api/report.controller.js"
import RoleController from "../methods/api/role.controller.js"
import WebsiteMessage from "../methods/api/websiteMessage.controller.js"
import MetricsController from "../methods/api/metrics.controller.js"
import LookupController from "../methods/api/lookup.controller.js"
import BannedWordsController from "../methods/api/bannedwords.controller.js"
import PlaceholderController from "../methods/api/placeholders.controller.js"

@Module({
    imports: [],
    controllers: [
        BuilderController,
        PingController,
        PunishController,
        ReportsController,
        RoleController,
        WebsiteMessage,
        MetricsController,
        LookupController,
        BannedWordsController,
        PlaceholderController
    ],
    providers: []
})
export class ApiModule {}
