import { env } from "cloudflare:workers";
export function database() {
 if (!env.DB) throw new Error("Result storage is unavailable");
 return env.DB;
}
