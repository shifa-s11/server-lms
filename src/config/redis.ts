import { createClient } from "redis";
require("dotenv").config();

if (!process.env.REDIS_URL) {
  throw new Error(" REDIS_URL not set in .env");
}

export const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("connect", () => console.log(" Redis connected"));
redis.on("error", (err) => console.error(" Redis Client Error", err));

(async () => {
  await redis.connect();
})();
