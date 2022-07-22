import typeorm from "typeorm"

export default function SnowflakePrimaryColumn(
    options?: typeorm.ColumnOptions
): PropertyDecorator {
    return typeorm.PrimaryColumn({
        ...options,
        type: "varchar",
        length: "19"
    } as typeorm.PrimaryColumnOptions)
}
