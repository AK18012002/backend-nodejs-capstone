const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

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

router.post("/login", async (req, res) => {
    try {
      // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
      const db = await connectToDatabase();
  
      // Task 2: Access MongoDB `users` collection
      const usersCollection = db.collection("users");
  
      // Read input
      const { email, password } = req.body || {};
  
      // Task 3: Check for user credentials in database
      const user = await usersCollection.findOne({ email });
  
      // Task 7: Send appropriate message if the user is not found
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Task 4: Check if the password matches the encrypted password and send appropriate message on mismatch
      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      // Task 5: Fetch user details from a database
      const userName = user.name || user.userName || "User";
      const userEmail = user.email;
  
      // Task 6: Create JWT authentication if passwords match with user._id as payload
      const authtoken = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
  
      // Return format shown in the lab template
      return res.json({ authtoken, userName, userEmail });
    } catch (e) {
      logger.error(e);
      return res.status(500).send("Internal server error");
    }
  });
  

  router.put(
    "/update",
    [
      // Task 1: input validation rules
      body("name").notEmpty().withMessage("Name is required"),
    ],
    async (req, res) => {
  
      // Task 2: Validate input using validationResult
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        // Task 3: Check if email is present in headers
        const email = req.headers.email;
        if (!email) {
          return res.status(400).json({ error: "Email not found in request headers" });
        }
  
        // Task 4: Connect to MongoDB
        const db = await connectToDatabase();
        const collection = db.collection("users");
  
        // Task 5: Find user credentials
        const existingUser = await collection.findOne({ email });
        if (!existingUser) {
          return res.status(404).json({ error: "User not found" });
        }
  
        // Update fields
        existingUser.firstName = req.body.name;
        existingUser.updatedAt = new Date();
  
        // Task 6: Update user credentials in DB
        await collection.updateOne(
          { email },
          { $set: existingUser }
        );
  
        // Task 7: Create JWT authentication
        const payload = {
          user: {
            id: existingUser._id.toString(),
          },
        };
  
        const authtoken = jwt.sign(payload, process.env.JWT_SECRET);
  
        return res.json({ authtoken });
      } catch (e) {
        logger.error(e);
        return res.status(500).send("Internal server error");
      }
    }
  );
  
module.exports = router;
