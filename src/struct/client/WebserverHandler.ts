import Client from "../Client"
import path from "path"
import fs from "fs"
import express from "express"
import util from "util"
import ApiPath from "../api/ApiPath"
import bodyParser from "body-parser"
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
    intercom: ApiPath
    constructor(client: Client) {
        this.client = client
        this.intercom = new ApiPath(this.client)
    }

    async load(): Promise<void> {
        const server = express()
        server.use(bodyParser.json())
        server.use(bodyParser.urlencoded({ extended: false }))

        server.use("/image", express.static(path.join(__dirname, "../../../images")))

        // parse application/json

        server.use("/api/v1", await this.intercom.loadAll())
        server.listen(this.client.config.images.bindPort)
    }

    async addImage(img: Buffer, name: string): Promise<string> {
        await ensureDirectoryExistence(path.join(__dirname, "../../../images/") + name)
        await util.promisify(fs.writeFile)(
            path.join(__dirname, "../../../images/") + name,
            img
        )
        return `http://${this.client.config.images.bindAddress}:${this.client.config.images.bindPort}/image/${name}` //fix this cardinal sin before pushing
    }

    getURLfromPath(name: string): string {
        return `http://${this.client.config.images.bindAddress}:${this.client.config.images.bindPort}/image/${name}` //fix this cardinal sin before pushing
    }

    async imageExists(name: string): Promise<boolean> {
        return fs.promises
            .access(path.join(__dirname, "../../../images/") + name, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false)
    }
}
