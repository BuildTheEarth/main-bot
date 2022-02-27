import { Module, NestModule, RequestMethod, MiddlewareConsumer } from "@nestjs/common"
import { ServeStaticModule } from "@nestjs/serve-static"
import { ApiModule } from "./baseModules/api.module"
import AuthProxy from "./middleware/AuthProxy.middleware"

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: "./images",
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
