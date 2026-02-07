const express = require("express");
const router = express.Router();
const connectToDatabase = require("../models/db");

// Search for items
router.get("/", async (req, res, next) => {
  try {
    // ✅ Task 1: Connect to MongoDB
    const db = await connectToDatabase();

    // Use the correct collection (from .env)
    const collection = db.collection(process.env.MONGO_COLLECTION);

    // Initialize query object
    let query = {};

    // ✅ Task 2: Add name filter if exists and not empty
    if (req.query.name && req.query.name.trim() !== "") {
      query.name = { $regex: req.query.name, $options: "i" };
    }

    // ✅ Task 3: Add other filters
    if (req.query.category && req.query.category.trim() !== "") {
      query.category = req.query.category;
    }

    if (req.query.condition && req.query.condition.trim() !== "") {
      query.condition = req.query.condition;
    }

    if (req.query.age_years) {
      query.age_years = { $lte: Number(req.query.age_years) };
    }

    // ✅ Task 4: Fetch filtered items
    const gifts = await collection.find(query).toArray();

    res.json(gifts);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
