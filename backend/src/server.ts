import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import pool from "./config/db.js";
import authRoutes from "./routes/auth.js";
import reportRoutes from "./routes/reports.js";
import investigationRoutes from "./routes/investigations.js";
import assignmentRoutes from "./routes/assignments.js";
import evidenceRoutes from "./routes/evidence.js";
import searchRoutes from "./routes/search.js";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is missing from backend/.env");
}

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000,
    createDatabaseTable: true,
  },
  pool
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    name: "phishing.sid",
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Authentication endpoints
app.use("/api/auth", authRoutes);

// Reporting endpoints
app.use("/api/reports", reportRoutes);

// Investigations endpoints
app.use("/api/reports", investigationRoutes);

// Assignment endpoints
app.use("/api/reports", assignmentRoutes);

// Evidence endpoints
app.use("/api/reports", evidenceRoutes);

// Vector Search endpoints
app.use("/api/search", searchRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "Phishing Report Repository API",
    status: "running",
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
