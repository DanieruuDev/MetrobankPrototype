const pool = require("../database/dbConnect.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, password } = req.body;
    console.log(req.body);
    const existingUser = await pool.query(
      `SELECT email FROM "user" WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("Account already exist");
      return res.status(400).send({ message: "Account already exists" });
    }
    const hashedPass = await bcrypt.hash(password, 5);

    const newUser = await pool.query(
      `INSERT INTO "user" (first_name, last_name, role, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [firstName, lastName, role, email, hashedPass]
    );
    return res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error("Error in registrations: ", error);
  }
};

const loginUser = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const { email, password } = req.body;

    //check if name exist
    const existingUser = await pool.query(
      `SELECT password FROM "user" WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }
    const userResult = existingUser.rows[0];
    console.log(userResult);
    //check password match
    const isPassValid = await bcrypt.compare(password, userResult.password);

    if (!isPassValid) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }

    //jwt
    const token = jwt.sign(
      {
        user_id: userResult.user_id,
        email: userResult.email,
        userType: "admin",
      },
      "SECRETKEY123",
      { expiresIn: "15min" }
    );
    await pool.query("COMMIT");
    return res.status(200).json({ email, token });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
  }
};

module.exports = { registerUser, loginUser };
