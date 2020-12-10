import { ValueTransformer } from "typeorm"

// millisecond-based timestamps (javascript "standard") don't fit in SQL ints (we'd have to use bigints),
// so we just transform them to seconds in the database
export default <ValueTransformer>{
    from: (value: number) => value * 1000,
    to: (value: number) => Math.round(value / 1000)
}
