import { Module } from "@nestjs/common"
import BuilderController from "../methods/api/builder.controller";
import PingController from "../methods/api/ping.controller";
import PunishController from "../methods/api/punish.controller";

@Module({
    imports: [],
    controllers: [
        BuilderController,
        PingController,
        PunishController
    ],
    providers: []
})
export class ApiModule {}
