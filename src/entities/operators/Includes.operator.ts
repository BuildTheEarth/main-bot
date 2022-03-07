import typeorm from "typeorm"

export default function Includes(value: string): typeorm.FindOperator<string> {
    return typeorm.Like(`%${value}%`)
}
