import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + "/../models/*.model.ts"],
  synchronize: false,
  // Query logs include parameter values (emails, password hashes), so only
  // log queries in development. Everywhere else, log errors only.
  logging:
    process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

/**
 * True when MySQL refused a row because a UNIQUE value already exists
 * (e.g. the same email twice). That is the user's problem (409), not a crash (500).
 */
export function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "ER_DUP_ENTRY"
  );
}

export default AppDataSource;
