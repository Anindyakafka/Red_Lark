import { maintenance } from "../../src/server/maintenance.ts";
export default async function handler() {
  await maintenance();
  return new Response(null, { status: 204 });
}
export const config = { schedule: "@hourly" };
