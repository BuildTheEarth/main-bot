import Client from "../Client.js"
import path from "path"
import fs from "fs"
import util from "util"
import { NestFactory } from "@nestjs/core"
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify'
import WebMain from "../web/WebMain.module.js"
import url from "url"

async function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath)
    if (fs.existsSync(dirname)) {
        return true
    }
    ensureDirectoryExistence(dirname)
    fs.mkdirSync(dirname)
}
export default class WebserverHandler {
    client: Client
    constructor(client: Client) {
        this.client = client
    }

    async load(): Promise<void> {
        const server = await NestFactory.create<NestFastifyApplication>(
            WebMain,
            new FastifyAdapter()
        )

        server.listen(this.client.config.images.bindPort, '0.0.0.0')
    }

    async addImage(img: Buffer, name: string): Promise<string> {
        await ensureDirectoryExistence(
            path.join(
                path.dirname(url.fileURLToPath(import.meta.url)),
                "../../../images/"
            ) + name
        )
        await util.promisify(fs.writeFile)(
            path.join(
                path.dirname(url.fileURLToPath(import.meta.url)),
                "../../../images/"
            ) + name,
            img
        )
        return `${this.client.config.images.bindAddress}:${this.client.config.images.bindPort}/image/${name}` //fix this cardinal sin before pushing
    }

    getURLfromPath(name: string): string {
        return `${this.client.config.images.bindAddress}:${this.client.config.images.bindPort}/image/${name}` //fix this cardinal sin before pushing
    }

    async imageExists(name: string): Promise<boolean> {
        return fs.promises
            .access(
                path.join(
                    path.dirname(url.fileURLToPath(import.meta.url)),
                    "../../../images/"
                ) + name,
                fs.constants.F_OK
            )
            .then(() => true)
            .catch(() => false)
    }
}
