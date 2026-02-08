const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const connectToDatabase = require("../models/db");
const logger = require("../logger");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const db = await connectToDatabase();

    // Task 2: Access MongoDB `users` collection
    const usersCollection = db.collection("users");

    // Read input
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Task 3: Check if user credentials already exist in the database and throw an error if they do
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Task 4: Create a hash to encrypt the password so that it is not readable in the database
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Task 5: Insert the user into the database
    const insertResult = await usersCollection.insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const userId = insertResult.insertedId;

    // Task 6: Create JWT authentication with user._id as payload
    const token = jwt.sign(
      { userId: userId.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Task 7: Log the successful registration using the logger
    logger.info(`User registered successfully: ${email}`);

    // Task 8: Return the user email and the token as a JSON
    return res.status(201).json({ email, token });
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
