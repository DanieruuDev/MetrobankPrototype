const { Pool } = require("pg");
require("dotenv").config();
console.log(process.env.DB_USER, process.env.DB_PASSWORD);
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

pool.on("connect", () => {
  console.log("Connected to the PostgreSQL database");
});

module.exports = pool;

// user: "postgres",
// password: "-Panturas09",
// host: "localhost",
// port: "5432",
// database: "prototype",
