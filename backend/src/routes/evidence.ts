import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const validEvidenceTypes = [
  "URL",
  "SCREENSHOT",
  "FILE",
  "MESSAGE",
  "OTHER",
] as const;

// Add evidence to a report.
router.post(
  "/:id/evidence",
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const user = req.session.user!;
      const reportId = Number(req.params.id);
      const { evidenceType, description, filePathOrUrl } = req.body;

      if (!Number.isInteger(reportId) || reportId <= 0) {
        res.status(400).json({ message: "Invalid report ID." });
        return;
      }

      if (
        typeof evidenceType !== "string" ||
        !validEvidenceTypes.includes(
          evidenceType as (typeof validEvidenceTypes)[number],
        )
      ) {
        res.status(400).json({
          message:
            "evidenceType must be URL, SCREENSHOT, FILE, MESSAGE, or OTHER.",
        });
        return;
      }

      if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
      ) {
        res.status(400).json({
          message: "Description must be a string.",
        });
        return;
      }

      if (
        filePathOrUrl !== undefined &&
        filePathOrUrl !== null &&
        (typeof filePathOrUrl !== "string" ||
          filePathOrUrl.length > 2048)
      ) {
        res.status(400).json({
          message: "filePathOrUrl must be a string of at most 2048 characters.",
        });
        return;
      }

      const [reports] = await pool.execute<RowDataPacket[]>(
        "SELECT report_id, user_id FROM report WHERE report_id = ?",
        [reportId],
      );

      if (reports.length === 0) {
        res.status(404).json({ message: "Report not found." });
        return;
      }

      // Reporters may add evidence only to their own reports.
      // Analysts and admins may add evidence to any report.
      if (
        user.role === "REPORTER" &&
        Number(reports[0].user_id) !== user.userId
      ) {
        res.status(403).json({
          message: "You cannot add evidence to another user's report.",
        });
        return;
      }

      const cleanDescription =
        typeof description === "string" ? description.trim() : null;
      const cleanFilePathOrUrl =
        typeof filePathOrUrl === "string" ? filePathOrUrl.trim() : null;

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO evidence
          (report_id, evidence_type, description, file_path_or_url)
         VALUES (?, ?, ?, ?)`,
        [
          reportId,
          evidenceType,
          cleanDescription,
          cleanFilePathOrUrl,
        ],
      );

      res.status(201).json({
        message: "Evidence added successfully.",
        evidence: {
          evidenceId: result.insertId,
          reportId,
          evidenceType,
          description: cleanDescription,
          filePathOrUrl: cleanFilePathOrUrl,
        },
      });
    } catch (error) {
      console.error("Adding evidence failed:", error);
      res.status(500).json({
        message: "Failed to add evidence.",
      });
    }
  },
);

// Retrieve evidence for a report.
router.get(
  "/:id/evidence",
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const user = req.session.user!;
      const reportId = Number(req.params.id);

      if (!Number.isInteger(reportId) || reportId <= 0) {
        res.status(400).json({ message: "Invalid report ID." });
        return;
      }

      const [reports] = await pool.execute<RowDataPacket[]>(
        "SELECT report_id, user_id FROM report WHERE report_id = ?",
        [reportId],
      );

      if (reports.length === 0) {
        res.status(404).json({ message: "Report not found." });
        return;
      }

      if (
        user.role === "REPORTER" &&
        Number(reports[0].user_id) !== user.userId
      ) {
        res.status(403).json({
          message: "You cannot view evidence for another user's report.",
        });
        return;
      }

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
           evidence_id AS evidenceId,
           report_id AS reportId,
           evidence_type AS evidenceType,
           description,
           file_path_or_url AS filePathOrUrl,
           uploaded_at AS uploadedAt
         FROM evidence
         WHERE report_id = ?
         ORDER BY uploaded_at DESC`,
        [reportId],
      );

      res.status(200).json({
        count: rows.length,
        evidence: rows,
      });
    } catch (error) {
      console.error("Fetching evidence failed:", error);
      res.status(500).json({
        message: "Failed to fetch evidence.",
      });
    }
  },
);

export default router;
