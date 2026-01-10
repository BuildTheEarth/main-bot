import BotClient from "../BotClient.js"
import { NestFactory } from "@nestjs/core"
import { ExpressAdapter, NestExpressApplication } from "@nestjs/platform-express"
import WebMain from "../web/WebMain.module.js"

export default class WebserverHandler {
    client: BotClient
    constructor(client: BotClient) {
        this.client = client
    }

    async load(): Promise<void> {
        const server = await NestFactory.create<NestExpressApplication>(
            WebMain,
            new ExpressAdapter()
        )

        server.listen(this.client.config.images.bindPort, "0.0.0.0")
    }
}
