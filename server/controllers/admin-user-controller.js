const pool = require("../database/dbConnect.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const registerAdmin = async (req, res) => {
  try {
    const { name, affiliation, role, password } = req.body;

    const existingUser = await pool.query(
      `SELECT name FROM admin WHERE name = $1`,
      [name]
    );

    if (existingUser.rows.length > 0) {
      console.log("Account already exist");
      return res.status(400).send({ message: "Account already exists" });
    }
    const hashedPass = await bcrypt.hash(password, 5);

    const newAdmin = await pool.query(
      "INSERT INTO admin (name, affiliation, role, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, affiliation, role, hashedPass]
    );
    return res.status(201).json(newAdmin.rows[0]);
  } catch (error) {
    console.error("Error in registrations: ", error);
  }
};

const loginAdmin = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const { name, password } = req.body;

    //check if name exist
    const nameQuery = await pool.query("SELECT * FROM admin WHERE name = $1", [
      name,
    ]);

    if (nameQuery.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }
    const nameResult = nameQuery.rows[0];
    //check password match
    const isPassValid = await bcrypt.compare(password, nameResult.password);

    if (!isPassValid) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }

    //jwt
    const token = jwt.sign(
      {
        admin_id: nameResult.admin_id,
        name: nameResult.name,
        role: nameResult.role,
      },
      "SECRETKEY123",
      { expiresIn: "15min" }
    );
    await pool.query("COMMIT");
    return res.status(200).json({ name, token });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
  }
};

module.exports = { registerAdmin, loginAdmin };
