import { defineConfig } from "drizzle-kit"

export default defineConfig({
    dialect: "sqlite",
    schema: "./schema.js",
    dbCredentials: {
        url: "users.db"
    }
})