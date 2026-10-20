import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Create an investigation for a report.
router.post(
  "/:id/investigation",
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const user = req.session.user!;

      if (user.role !== "ANALYST" && user.role !== "ADMIN") {
        res.status(403).json({
          message: "Only analysts and admins can record investigations.",
        });
        return;
      }

      const reportId = Number(req.params.id);
      const { finding, remarks } = req.body;

      if (!Number.isInteger(reportId) || reportId <= 0) {
        res.status(400).json({ message: "Invalid report ID." });
        return;
      }

      if (typeof finding !== "string" || !finding.trim()) {
        res.status(400).json({ message: "Finding is required." });
        return;
      }

      if (
        remarks !== undefined &&
        remarks !== null &&
        typeof remarks !== "string"
      ) {
        res.status(400).json({
          message: "Remarks must be a string.",
        });
        return;
      }

      const [reports] = await pool.execute<RowDataPacket[]>(
        "SELECT report_id FROM report WHERE report_id = ?",
        [reportId],
      );

      if (reports.length === 0) {
        res.status(404).json({ message: "Report not found." });
        return;
      }

      const [analysts] = await pool.execute<RowDataPacket[]>(
        "SELECT analyst_id FROM analyst WHERE user_id = ?",
        [user.userId],
      );

      if (analysts.length === 0) {
        res.status(403).json({
          message: "Your user account is not registered as an analyst.",
        });
        return;
      }

      const analystId = analysts[0].analyst_id;

      const [existing] = await pool.execute<RowDataPacket[]>(
        "SELECT investigation_id FROM investigation WHERE report_id = ?",
        [reportId],
      );

      if (existing.length > 0) {
        res.status(409).json({
          message: "An investigation already exists for this report.",
        });
        return;
      }

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO investigation
          (report_id, analyst_id, finding, remarks)
         VALUES (?, ?, ?, ?)`,
        [
          reportId,
          analystId,
          finding.trim(),
          typeof remarks === "string" ? remarks.trim() : null,
        ],
      );

      res.status(201).json({
        message: "Investigation recorded successfully.",
        investigation: {
          investigationId: result.insertId,
          reportId,
          analystId,
          finding: finding.trim(),
          remarks: typeof remarks === "string" ? remarks.trim() : null,
        },
      });
    } catch (error) {
      console.error("Creating investigation failed:", error);

      // Handle a concurrent request for the same report.
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
        res.status(409).json({
          message: "An investigation already exists for this report.",
        });
        return;
      }

      res.status(500).json({
        message: "Failed to record investigation.",
      });
    }
  },
);

// Retrieve an investigation.
router.get(
  "/:id/investigation",
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const user = req.session.user!;
      const reportId = Number(req.params.id);

      if (!Number.isInteger(reportId) || reportId <= 0) {
        res.status(400).json({ message: "Invalid report ID." });
        return;
      }

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
           i.investigation_id AS investigationId,
           i.report_id AS reportId,
           i.analyst_id AS analystId,
           u.name AS analystName,
           i.finding,
           i.remarks,
           i.investigated_at AS investigatedAt,
           i.resolved_at AS resolvedAt
         FROM investigation i
         JOIN analyst a ON i.analyst_id = a.analyst_id
         JOIN users u ON a.user_id = u.user_id
         JOIN report r ON i.report_id = r.report_id
         WHERE i.report_id = ?
           AND (? <> 'REPORTER' OR r.user_id = ?)`,
        [reportId, user.role, user.userId],
      );

      if (rows.length === 0) {
        // Distinguish a missing report from one without an investigation.
        const [reports] = await pool.execute<RowDataPacket[]>(
          "SELECT report_id FROM report WHERE report_id = ?",
          [reportId],
        );

        if (reports.length === 0) {
          res.status(404).json({ message: "Report not found." });
          return;
        }

        if (user.role === "REPORTER") {
          const [ownReports] = await pool.execute<RowDataPacket[]>(
            "SELECT report_id FROM report WHERE report_id = ? AND user_id = ?",
            [reportId, user.userId],
          );

          if (ownReports.length === 0) {
            res.status(403).json({
              message: "You cannot view another user's investigation.",
            });
            return;
          }
        }

        res.status(404).json({
          message: "No investigation exists for this report.",
        });
        return;
      }

      res.status(200).json({ investigation: rows[0] });
    } catch (error) {
      console.error("Fetching investigation failed:", error);
      res.status(500).json({
        message: "Failed to fetch investigation.",
      });
    }
  },
);

export default router;
