import typeorm from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"

@typeorm.Entity({ name: "teampoints_log" })
export default class TeamPointsLog extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id: number

    @SnowflakeColumn()
    actorId: string

    @typeorm.Column({ type: "float" })
    pointChange: number

    @typeorm.Column({ type: "text" })
    reason: string

    //TODO: more data proccessing functions
}
