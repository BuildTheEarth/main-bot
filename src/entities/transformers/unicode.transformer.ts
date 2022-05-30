import typeorm from "typeorm"

//this is a ghost transformer till i get stuff working
export default <typeorm.ValueTransformer>{
    from: (value: string): string | null => {
        return value
    },
    to: (value: string): string | null => {
        return value
    }
}
