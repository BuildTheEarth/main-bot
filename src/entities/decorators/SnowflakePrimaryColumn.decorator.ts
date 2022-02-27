import { PrimaryColumn, PrimaryColumnOptions, ColumnOptions } from "typeorm"

export default function SnowflakePrimaryColumn(
    options?: ColumnOptions
): PropertyDecorator {
    return PrimaryColumn({
        ...options,
        type: "varchar",
        length: "18"
    } as PrimaryColumnOptions)
}
