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

// database identifier: sampledatabase
// Host name: thesisdatabase.c34628u0ijay.ap-southeast-2.rds.amazonaws.com
// Master username: sungjinwoh
// Master password: mastersungjinwoo

// user: "postgres",
// password: "-Panturas09",
// host: "localhost",
// port: "5432",
// database: "prototype",
