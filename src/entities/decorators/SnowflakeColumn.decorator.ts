import typeorm from "typeorm"

export default function SnowflakeColumn(
    options?: typeorm.ColumnOptions
): PropertyDecorator {
    return typeorm.Column({ ...options, type: "varchar", length: "19" })
}
