import { Module } from "@nestjs/common"
import BuilderController from "../methods/api/builder.controller.js"
import PingController from "../methods/api/ping.controller.js"
import PunishController from "../methods/api/punish.controller.js"
import ReportsController from "../methods/api/report.controller.js"

@Module({
    imports: [],
    controllers: [BuilderController, PingController, PunishController, ReportsController],
    providers: []
})
export class ApiModule {}
