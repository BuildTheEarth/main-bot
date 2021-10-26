import Client from "../Client"
import path from "path"
import fs from "fs"
import express from "express"
import util from "util"
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
        const server = express()
        server.use(express.static(path.join(__dirname, "../../../images")))
        server.listen(this.client.config.images.bindPort)
    }

    async addImage(img: Buffer, name: string): Promise<string> {
        await ensureDirectoryExistence("file://../images/" + name)
        await util.promisify(fs.writeFile)("file://../images/" + name, img)
        return `http://${this.client.config.images.bindAddress}:${this.client.config.images.bindPort}/${name}` //fix this cardinal sin before pushing
    }

    getURLfromPath(name: string): string {
        return `http://${this.client.config.images.bindAddress}:${this.client.config.images.bindPort}/${name}` //fix this cardinal sin before pushing
    }

    async imageExists(name: string): Promise<boolean> {
        return fs.promises
            .access(path.join(__dirname, "../../../images/") + name, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false)
    }
}
