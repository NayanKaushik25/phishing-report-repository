import { Router } from "express";
import { neo4jDriver } from "../config/neo4j.js";
import { generateEmbedding } from "../services/embedding.js";
import { requireAuth } from "../middleware/auth.js";
import neo4j from "neo4j-driver";

const router = Router();

function normalizeReportId(value: unknown): number {
  if (neo4j.isInt(value)) {
    return value.toNumber();
  }

  if (typeof value === "number") {
    return value;
  }

  throw new Error("Unexpected reportId type from Neo4j");
}

router.get("/semantic", requireAuth, async (req, res) => {
  const query = req.query.q;

  if (typeof query !== "string" || !query.trim()) {
    res.status(400).json({
      error: "Provide a search query using ?q=your search text",
    });
    return;
  }

  const session = neo4jDriver.session({ database: "neo4j" });

  try {
    const queryEmbedding = await generateEmbedding(query);

    const result = await session.run(
       `MATCH (r:Report)
        SEARCH r IN (
          VECTOR INDEX report_embedding_index
          FOR $queryEmbedding
          LIMIT 10
        )
        SCORE AS score
        RETURN
          r.reportId AS reportId,
          r.title AS title,
          r.description AS description,
          r.severity AS severity,
          r.status AS status,
          score
        ORDER BY score DESC`,
      { queryEmbedding }
    );

    res.json({
      query,
      results: result.records.map((record) => ({
        reportId: normalizeReportId(record.get("reportId")),
        title: record.get("title"),
        description: record.get("description"),
        severity: record.get("severity"),
        status: record.get("status"),
        score: record.get("score"),
      })),
    });
  } catch (error) {
    console.error("Semantic search failed:", error);
    res.status(500).json({ error: "Semantic search failed" });
  } finally {
    await session.close();
  }
});

export default router;
