import express from "express"

export default class ApiPathHandler implements ApiPathHandlerProperties {
    path: string

    get?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void

    post?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void

    put?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void

    delete?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void

    all?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void
    constructor(properties: ApiPathHandlerProperties) {
        this.path = properties.path
        if (properties.get) this.get = properties.get
        if (properties.post) this.post = properties.post
        if (properties.put) this.put = properties.put
        if (properties.delete) this.delete = properties.delete
        if (properties.all) this.all = properties.all
    }
}

export interface ApiPathHandlerProperties {
    path: string

    get?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void

    post?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void

    put?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void

    delete?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void

    all?: (
        req: express.Request,
        res: express.Response,
        next?: express.NextFunction
    ) => void
}
