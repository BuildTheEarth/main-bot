import { Module, NestModule, RequestMethod, MiddlewareConsumer } from "@nestjs/common"
import { ServeStaticModule } from "@nestjs/serve-static"
import { ApiModule } from "./baseModules/api.module.js"
import AuthProxy from "./middleware/AuthProxy.middleware.js"
import pathModule from "path"
import url from "url"
import path from "path"

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: path.join(
                pathModule.dirname(url.fileURLToPath(import.meta.url)),
                "../../../images"
            ),
            serveRoot: "/image",
            serveStaticOptions: {
                cacheControl: true,
                dotfiles: "ignore",
                index: false
            }
        }),
        ApiModule
    ],
    controllers: [],
    providers: []
})
export default class WebMain implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(AuthProxy)
            .forRoutes({ path: "/api/v1/*", method: RequestMethod.ALL })
    }
}
