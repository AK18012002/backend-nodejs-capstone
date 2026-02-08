/*jshint esversion: 8 */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pinoHttp = require("pino-http");
const logger = require("./logger");
const authRoutes = require("./routes/authRoutes");

const connectToDatabase = require("./models/db");

// Routes
const secondChanceItemsRoutes = require("./routes/secondChanceItemsRoutes");
const searchRoutes = require("./routes/searchRoutes");

const app = express();
const port = 3060;

// Middleware
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use("/api/auth", authRoutes);

// Connect to MongoDB once
connectToDatabase()
  .then(() => logger.info("Connected to DB"))
  .catch((e) => console.error("Failed to connect to DB", e));

// Mount APIs
app.use("/api/secondchance/items", secondChanceItemsRoutes);
app.use("/api/secondchance/search", searchRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Inside the server");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

