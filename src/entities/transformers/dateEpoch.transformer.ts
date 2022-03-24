import typeorm from "typeorm"

export default <typeorm.ValueTransformer>{
    from: (value: number) => (value === null ? null : new Date(value * 1000)),
    to: (value: Date) => (value === null ? null : Math.round(value.getTime() / 1000))
}