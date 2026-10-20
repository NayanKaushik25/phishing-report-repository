
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Assign a report to an analyst.
router.post(
  "/:id/assign",
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const user = req.session.user!;

      if (user.role !== "ADMIN") {
        res.status(403).json({
          message: "Only administrators can assign reports.",
        });
        return;
      }

      const reportId = Number(req.params.id);
      const { analystId } = req.body;

      if (!Number.isInteger(reportId) || reportId <= 0) {
        res.status(400).json({ message: "Invalid report ID." });
        return;
      }

      if (
        !Number.isInteger(Number(analystId)) ||
        Number(analystId) <= 0
      ) {
        res.status(400).json({
          message: "analystId must be a positive integer.",
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
        `SELECT a.analyst_id, u.name
         FROM analyst a
         JOIN users u ON a.user_id = u.user_id
         WHERE a.analyst_id = ? AND u.role = 'ANALYST'`,
        [Number(analystId)],
      );

      if (analysts.length === 0) {
        res.status(404).json({ message: "Analyst not found." });
        return;
      }

      // End any existing active assignment before creating the new one.
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        await connection.execute(
          `UPDATE report_assignment
           SET ended_at = CURRENT_TIMESTAMP
           WHERE report_id = ? AND ended_at IS NULL`,
          [reportId],
        );

        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO report_assignment
            (report_id, analyst_id, assigned_by)
           VALUES (?, ?, ?)`,
          [reportId, Number(analystId), user.userId],
        );

        await connection.commit();

        res.status(201).json({
          message: "Report assigned successfully.",
          assignment: {
            assignmentId: result.insertId,
            reportId,
            analystId: Number(analystId),
            analystName: analysts[0].name,
            assignedBy: user.userId,
          },
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Assigning report failed:", error);
      res.status(500).json({
        message: "Failed to assign report.",
      });
    }
  },
);

// View assignment history for a report.
router.get(
  "/:id/assignments",
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
          message: "You cannot view another user's report assignments.",
        });
        return;
      }

      const [assignments] = await pool.execute<RowDataPacket[]>(
        `SELECT
           ra.assignment_id AS assignmentId,
           ra.report_id AS reportId,
           ra.analyst_id AS analystId,
           u.name AS analystName,
           ra.assigned_by AS assignedBy,
           ra.assigned_at AS assignedAt,
           ra.ended_at AS endedAt
         FROM report_assignment ra
         JOIN analyst a ON ra.analyst_id = a.analyst_id
         JOIN users u ON a.user_id = u.user_id
         WHERE ra.report_id = ?
         ORDER BY ra.assigned_at DESC`,
        [reportId],
      );

      res.status(200).json({
        count: assignments.length,
        assignments,
      });
    } catch (error) {
      console.error("Fetching assignments failed:", error);
      res.status(500).json({
        message: "Failed to fetch assignments.",
      });
    }
  },
);

export default router;
