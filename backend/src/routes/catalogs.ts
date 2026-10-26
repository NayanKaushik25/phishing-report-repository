import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res): Promise<void> => {
  try {
    const [accounts] = await pool.execute<RowDataPacket[]>(
      `SELECT
         a.account_id AS accountId,
         a.username,
         a.account_type AS accountType,
         a.profile_url AS profileUrl,
         p.platform_name AS platformName
       FROM account a
       JOIN platform p ON a.platform_id = p.platform_id
       ORDER BY p.platform_name, a.username`,
    );
    const [categories] = await pool.execute<RowDataPacket[]>(
      `SELECT category_id AS categoryId, category_name AS categoryName, description
       FROM category
       ORDER BY category_name`,
    );
    const [analysts] = await pool.execute<RowDataPacket[]>(
      `SELECT a.analyst_id AS analystId, u.name, a.department
       FROM analyst a
       JOIN users u ON a.user_id = u.user_id
       WHERE u.role = 'ANALYST'
       ORDER BY u.name`,
    );

    res.json({ accounts, categories, analysts });
  } catch (error) {
    console.error("Fetching catalogs failed:", error);
    res.status(500).json({ message: "Failed to fetch report catalogs." });
  }
});

export default router;
