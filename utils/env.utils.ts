/** Reads a required setting from `.env`. Missing → the server refuses to start. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing in .env`);
  return value;
}
