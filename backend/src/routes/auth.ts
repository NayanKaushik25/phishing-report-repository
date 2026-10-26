import { Router } from "express";
import argon2 from "argon2";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

const router = Router();

// Classroom-only access: creates a session without collecting credentials.
// Keep this disabled in production.
router.post("/demo", (req, res) => {
  if (process.env.DEMO_MODE !== "true") {
    res.status(404).json({ message: "Demo access is disabled." });
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      console.error("Demo session regeneration failed:", err);
      res.status(500).json({ message: "Demo access failed." });
      return;
    }

    req.session.user = {
      userId: Number(process.env.DEMO_USER_ID || 1),
      name: "Nihar",
      email: "demo@classroom.local",
      role: "ADMIN",
    };

    req.session.save((saveError) => {
      if (saveError) {
        console.error("Demo session save failed:", saveError);
        res.status(500).json({ message: "Demo access failed." });
        return;
      }

      res.json({ message: "Demo access granted", user: req.session.user });
    });
  });
});

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "REPORTER" | "ANALYST" | "ADMIN";
}

// Register a new Reporter
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 12
    ) {
      res.status(400).json({
        message:
          "Name, email and a password of at least 12 characters are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length > 255 || name.trim().length > 100) {
      res.status(400).json({
        message: "Name or email is too long",
      });
      return;
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT user_id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      res.status(409).json({
        message: "An account with this email already exists",
      });
      return;
    }

    const passwordHash = await argon2.hash(password);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'REPORTER')`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    res.status(201).json({
      message: "Registration successful",
      user: {
        userId: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        role: "REPORTER",
      },
    });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({
      message: "Registration failed",
    });
  }
});

// Log in and establish a server-side session
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [rows] = await pool.execute<UserRow[]>(
      `SELECT user_id, name, email, password_hash, role
       FROM users
       WHERE email = ?`,
      [normalizedEmail]
    );

    const user = rows[0];

    if (!user || !(await argon2.verify(user.password_hash, password))) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration failed:", err);
        res.status(500).json({
          message: "Login failed",
        });
        return;
      }

      req.session.user = {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError);
          res.status(500).json({
            message: "Login failed",
          });
          return;
        }

        res.json({
          message: "Login successful",
          user: req.session.user,
        });
      });
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({
      message: "Login failed",
    });
  }
});

// Log out
router.post("/logout", requireAuth, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie("phishing.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      message: "Logout successful",
    });
  });
});

// Return the current user
router.get("/me", requireAuth, (req, res) => {
  res.json({
    user: req.session.user,
  });
});

export default router;
