const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const connectToDatabase = require("../models/db");
const logger = require("../logger");

// Use env collection name if provided, else fallback
const COLLECTION_NAME = process.env.MONGO_COLLECTION || "secondChanceItems";

// Define the upload directory path
const directoryPath = "public/images";

// Ensure upload directory exists
if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath);
  },
  filename: function (req, file, cb) {
    // keep original name (lab style) — you can also make it unique if needed
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// ✅ GET all secondChanceItems
router.get("/", async (req, res, next) => {
  logger.info("/api/secondchance/items GET called");
  try {
    // Step 2 Task 1: connect DB
    const db = await connectToDatabase();

    // Step 2 Task 2: get collection
    const collection = db.collection(COLLECTION_NAME);

    // Step 2 Task 3: fetch all
    const secondChanceItems = await collection.find({}).toArray();

    // Step 2 Task 4: return json
    res.json(secondChanceItems);
  } catch (e) {
    logger.error("Failed to fetch items", e);
    res.status(500).json({ message: "Failed to fetch items", error: e.message });
  }
});

// ✅ POST add new item (+ image upload)
router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    // Step 3 Task 1: connect DB
    const db = await connectToDatabase();

    // Step 3 Task 2: get collection
    const collection = db.collection(COLLECTION_NAME);

    // Step 3 Task 3: create new item from req.body
    const newItem = { ...req.body };

    // Step 3 Task 4: get last id and increment
    const lastItemArr = await collection.find().sort({ id: -1 }).limit(1).toArray();
    const newId = lastItemArr.length ? Number(lastItemArr[0].id) + 1 : 1;

    newItem.id = newId;

    // Step 3 Task 5: set current date
    newItem.createdAt = new Date();

    // If multer uploaded an image, store filename/path info in DB (optional but useful)
    if (req.file) {
      newItem.image = req.file.filename;
      newItem.imagePath = path.join("public/images", req.file.filename);
    }

    // Step 3 Task 6: insert into DB
    const result = await collection.insertOne(newItem);

    // Step 3 Task 7: image is already uploaded by multer (done)

    res.status(201).json({ message: "Item created", item: { _id: result.insertedId, ...newItem } });
  } catch (e) {
    logger.error("Failed to add item", e);
    res.status(500).json({ message: "Failed to add item", error: e.message });
  }
});

// ✅ GET single item by id
router.get("/:id", async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const id = Number(req.params.id);
    const secondChanceItem = await collection.findOne({ id });

    if (!secondChanceItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(secondChanceItem);
  } catch (e) {
    logger.error("Failed to fetch item", e);
    res.status(500).json({ message: "Failed to fetch item", error: e.message });
  }
});

// ✅ PUT update item by id
router.put("/:id", async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const id = Number(req.params.id);

    // Step 5 Task 3: check exists
    const existing = await collection.findOne({ id });
    if (!existing) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Step 5 Task 4: update specific attributes + calculated values
    const age_days = Number(req.body.age_days);
    const age_years = Number((age_days / 365).toFixed(1));

    const updateDoc = {
      $set: {
        category: req.body.category,
        condition: req.body.condition,
        age_days: age_days,
        description: req.body.description,
        age_years: age_years,
        updatedAt: new Date(),
      },
    };

    await collection.updateOne({ id }, updateDoc);

    // Step 5 Task 5: confirmation
    res.json({ message: "Item updated successfully" });
  } catch (e) {
    logger.error("Failed to update item", e);
    res.status(500).json({ message: "Failed to update item", error: e.message });
  }
});

// ✅ DELETE item by id
router.delete("/:id", async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const id = Number(req.params.id);

    // Step 6 Task 3: check exists
    const existing = await collection.findOne({ id });
    if (!existing) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Step 6 Task 4: delete
    await collection.deleteOne({ id });

    res.json({ message: "Item deleted successfully" });
  } catch (e) {
    logger.error("Failed to delete item", e);
    res.status(500).json({ message: "Failed to delete item", error: e.message });
  }
});

module.exports = router;
