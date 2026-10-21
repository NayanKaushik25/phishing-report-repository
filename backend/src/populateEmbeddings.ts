import "dotenv/config";
import { neo4jDriver } from "./config/neo4j.js";
import { generateEmbedding } from "./services/embedding.js";

const reports = [
  {
    reportId: 1,
    title: "Fake bank support account",
    description:
      "An account impersonates bank support and requests login details.",
  },
  {
    reportId: 2,
    title: "Suspicious cryptocurrency giveaway",
    description:
      "An account promises cryptocurrency rewards in exchange for payment.",
  },
  {
    reportId: 3,
    title: "Fake account verification message",
    description:
      "A suspicious account asks users to verify their credentials.",
  },
  {
    reportId: 4,
    title: "Test phishing report",
    description:
      "This account appears to be impersonating another user.",
  },
];

async function populateEmbeddings() {
  const session = neo4jDriver.session({ database: "neo4j" });
  const check = await session.run(
  "MATCH (r:Report) RETURN count(r) AS count"
);

console.log(
  "Reports visible to script:",
  check.records[0].get("count").toString()
);
  try {
    for (const report of reports) {
      const text = `${report.title}. ${report.description}`;
      const embedding = await generateEmbedding(text);

      const result = await session.run(
        `MATCH (r:Report {reportId: $reportId})
         SET r.description = $description,
             r.embedding = $embedding
         RETURN r.reportId AS reportId`,
        {
          reportId: report.reportId,
          description: report.description,
          embedding,
        }
      );

      if (result.records.length === 0) {
        console.warn(`Report ${report.reportId} was not found in Neo4j.`);
      } else {
        console.log(`Stored embedding for report ${report.reportId}`);
      }
    }
  } finally {
    await session.close();
    await neo4jDriver.close();
  }
}

populateEmbeddings().catch((error) => {
  console.error("Failed to populate embeddings:", error);
  process.exitCode = 1;
});
