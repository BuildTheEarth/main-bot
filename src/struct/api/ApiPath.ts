import { Collection } from "discord.js"
import express, { Router } from "express"
import loadDir from "../../util/loadDir"
import Client from "../Client"
import ApiPathHandler from "./ApiPathHandler"

export default class ApiPath {
    client: Client
    router: Router = express.Router()
    handlers: Collection<string, ApiPathHandler>
    constructor(client: Client) {
        this.client = client
    }

    async loadAll(): Promise<Router> {
        this.handlers = await loadDir<ApiPathHandler>(
            __dirname + "/methods/",
            this.client
        )

        for (const handler of this.handlers.values()) {
            if (handler.get) this.router.get(handler.path, handler.get)
            if (handler.post) this.router.post(handler.path, handler.post)
            if (handler.put) this.router.put(handler.path, handler.put)
            if (handler.delete) this.router.delete(handler.path, handler.delete)
            if (handler.all) this.router.all(handler.path, handler.all)
        }

        return this.router
    }
}
