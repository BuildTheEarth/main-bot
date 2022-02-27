import { FindOperator, Like } from "typeorm"

export default function Includes(value: string): FindOperator<string> {
    return Like(`%${value}%`)
}
