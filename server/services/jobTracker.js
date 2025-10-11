const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: "default",
  password: process.env.REDIS_PASSWORD,
});

// Set a job with optional data
async function setJob(jobId, status, data = {}) {
  const stringifiedData = {};
  for (const key in data) {
    if (typeof data[key] === "object") {
      stringifiedData[key] = JSON.stringify(data[key]);
    } else {
      stringifiedData[key] = data[key];
    }
  }
  await redis.hmset(`job:${jobId}`, { status, ...stringifiedData });
}

// Get a job and parse JSON fields
async function getJob(jobId) {
  const data = await redis.hgetall(`job:${jobId}`);
  if (!Object.keys(data).length) return null;

  const parsedData = {};
  for (const key in data) {
    try {
      parsedData[key] = JSON.parse(data[key]);
    } catch (e) {
      parsedData[key] = data[key];
    }
  }
  return parsedData;
}

// ✅ Export both functions correctly
module.exports = { setJob, getJob };
