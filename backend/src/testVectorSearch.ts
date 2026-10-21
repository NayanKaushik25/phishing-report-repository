
import "dotenv/config";
import { neo4jDriver } from "./config/neo4j.js";
import { generateEmbedding } from "./services/embedding.js";

async function testVectorSearch() {
  const query =
    "A fake bank account trying to steal people's login credentials";

  const queryEmbedding = await generateEmbedding(query);
  const session = neo4jDriver.session({ database: "neo4j" });

  try {
    const result = await session.run(
      `MATCH (r:Report)
       WHERE r.embedding IS NOT NULL
       WITH r, vector.similarity.cosine(
         r.embedding, $queryEmbedding
       ) AS score
       RETURN r.reportId AS reportId,
              r.title AS title,
              score
       ORDER BY score DESC
       LIMIT 3`,
      { queryEmbedding }
    );

    for (const record of result.records) {
      console.log({
        reportId: record.get("reportId"),
        title: record.get("title"),
        score: record.get("score"),
      });
    }
  } finally {
    await session.close();
    await neo4jDriver.close();
  }
}

testVectorSearch().catch((error) => {
  console.error("Vector search failed:", error);
  process.exitCode = 1;
});
