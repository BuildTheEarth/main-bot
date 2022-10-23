import { Module } from "@nestjs/common"
import BuilderController from "../methods/api/builder.controller.js"
import PingController from "../methods/api/ping.controller.js"
import PunishController from "../methods/api/punish.controller.js"
import ReportsController from "../methods/api/report.controller.js"
import RoleController from "../methods/api/role.controller.js"

@Module({
    imports: [],
    controllers: [BuilderController, PingController, PunishController, ReportsController, RoleController],
    providers: []
})
export class ApiModule {}
