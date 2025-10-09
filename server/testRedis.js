import { createClient } from "redis";

const client = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: "redis-18803.c44.us-east-1-2.ec2.redns.redis-cloud.com",
    port: 18803,
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));

await client.connect();

await client.set("foo", "bar");
const result = await client.get("foo");
console.log(result); // >>> bar
