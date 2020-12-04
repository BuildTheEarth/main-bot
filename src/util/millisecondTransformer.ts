import { ValueTransformer } from "typeorm"

export default <ValueTransformer>{
    from: (value: number) => value * 1000,
    to: (value: number) => Math.round(value / 1000)
}
