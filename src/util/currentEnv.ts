export enum CurrEnvValues {
    TESTING = "Testing",
    PRODUCTION = "Production",
    PRODUCTION_DOCKER = "Docker 🐳"
}

export default function currentEnv(): CurrEnvValues {
    if (process.env.IN_DOCKER === "yes") return CurrEnvValues.PRODUCTION_DOCKER
    if (process.env.NODE_ENV === "production") return CurrEnvValues.PRODUCTION_DOCKER
    return CurrEnvValues.TESTING
}
