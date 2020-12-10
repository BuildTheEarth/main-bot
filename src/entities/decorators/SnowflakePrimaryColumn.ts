import { PrimaryColumn, ColumnOptions } from "typeorm"

export default function SnowflakePrimaryColumn(
    options?: ColumnOptions
): PropertyDecorator {
    return PrimaryColumn({ ...options, type: "string", length: "18" })
}
