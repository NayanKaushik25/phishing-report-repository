import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

interface AccountRow extends RowDataPacket {
  account_id: number;
}



router.get("/", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = req.session.user!;

    const baseQuery = `
      SELECT
        r.report_id AS reportId,
        r.title,
        r.description,
        r.severity,
        r.status,
        r.reported_at AS reportedAt,
        u.name AS reporterName,
        a.username AS accountUsername,
        p.platform_name AS platformName,
        c.category_name AS categoryName
      FROM report r
      JOIN users u ON r.user_id = u.user_id
      JOIN account a ON r.account_id = a.account_id
      JOIN platform p ON a.platform_id = p.platform_id
      JOIN category c ON r.category_id = c.category_id
    `;

    const [rows] =
      user.role === "REPORTER"
        ? await pool.execute(
            `${baseQuery}
             WHERE r.user_id = ?
             ORDER BY r.reported_at DESC`,
            [user.userId],
          )
        : await pool.execute(
            `${baseQuery}
             ORDER BY r.reported_at DESC`,
          );

    res.status(200).json({
      count: (rows as unknown[]).length,
      reports: rows,
    });
  } catch (error) {
    console.error("Fetching reports failed:", error);
    res.status(500).json({
      message: "Failed to fetch reports.",
    });
  }
});


router.patch(
  "/:id/status",
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const user = req.session.user!;

      // Only analysts and admins can update report status.
      if (user.role !== "ANALYST" && user.role !== "ADMIN") {
        res.status(403).json({
          message: "Only analysts and admins can update report status.",
        });
        return;
      }

      const reportId = Number(req.params.id);
      const { status } = req.body;

      if (!Number.isInteger(reportId) || reportId <= 0) {
        res.status(400).json({
          message: "Report ID must be a positive integer.",
        });
        return;
      }

      const validStatuses = [
        "PENDING",
        "UNDER_REVIEW",
        "RESOLVED",
        "REJECTED",
      ];

      if (typeof status !== "string" || !validStatuses.includes(status)) {
        res.status(400).json({
          message:
            "Status must be PENDING, UNDER_REVIEW, RESOLVED, or REJECTED.",
        });
        return;
      }

      const [existingReports] = await pool.execute(
        "SELECT report_id FROM report WHERE report_id = ?",
        [reportId],
      );

      if ((existingReports as unknown[]).length === 0) {
        res.status(404).json({ message: "Report not found." });
        return;
      }

      const [result] = await pool.execute(
        "UPDATE report SET status = ? WHERE report_id = ?",
        [status, reportId],
      );

      res.status(200).json({
        message: "Report status updated successfully.",
        reportId,
        status,
      });
    } catch (error) {
      console.error("Updating report status failed:", error);
      res.status(500).json({
        message: "Failed to update report status.",
      });
    }
  },
);


router.post("/", requireAuth, async (req, res): Promise<void> => {
  try {
    const { accountId, categoryId, title, description, severity } = req.body;

    // Validate required fields.
    if (
      accountId === undefined ||
      categoryId === undefined ||
      typeof title !== "string" ||
      typeof description !== "string" ||
      !title.trim() ||
      !description.trim()
    ) {
      res.status(400).json({
        message:
          "accountId, categoryId, title, and description are required.",
      });
      return;
    }

    // Validate IDs.
    if (
      !Number.isInteger(Number(accountId)) ||
      Number(accountId) <= 0 ||
      !Number.isInteger(Number(categoryId)) ||
      Number(categoryId) <= 0
    ) {
      res.status(400).json({
        message: "accountId and categoryId must be positive integers.",
      });
      return;
    }

    // Validate text lengths against the database schema.
    if (title.trim().length > 200) {
      res.status(400).json({
        message: "Title must be 200 characters or fewer.",
      });
      return;
    }

    // Severity defaults to MEDIUM.
    const reportSeverity = severity ?? "MEDIUM";

    if (
      typeof reportSeverity !== "string" ||
      !validSeverities.includes(
        reportSeverity as (typeof validSeverities)[number],
      )
    ) {
      res.status(400).json({
        message: "Severity must be LOW, MEDIUM, HIGH, or CRITICAL.",
      });
      return;
    }

    // Confirm the referenced account exists.
    const [accounts] = await pool.execute<AccountRow[]>(
      "SELECT account_id FROM account WHERE account_id = ?",
      [Number(accountId)],
    );

    if (accounts.length === 0) {
      res.status(404).json({ message: "Account not found." });
      return;
    }

    // Confirm the referenced category exists.
    const [categories] = await pool.execute<RowDataPacket[]>(
      "SELECT category_id FROM category WHERE category_id = ?",
      [Number(categoryId)],
    );

    if (categories.length === 0) {
      res.status(404).json({ message: "Category not found." });
      return;
    }

    // Create the report under the authenticated user's ID.
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO report
        (user_id, account_id, category_id, title, description, severity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.session.user!.userId,
        Number(accountId),
        Number(categoryId),
        title.trim(),
        description.trim(),
        reportSeverity,
      ],
    );

    res.status(201).json({
      message: "Phishing report created successfully.",
      report: {
        reportId: result.insertId,
        accountId: Number(accountId),
        categoryId: Number(categoryId),
        title: title.trim(),
        description: description.trim(),
        severity: reportSeverity,
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Report creation failed:", error);
    res.status(500).json({ message: "Failed to create phishing report." });
  }
});

export default router;
