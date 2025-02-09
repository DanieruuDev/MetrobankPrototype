const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "-Panturas09",
  host: "localhost",
  port: "5432",
  database: "prototype",
});

pool.on("connect", () => {
  console.log("Connected to the PostgreSQL database");
});

module.exports = pool;
