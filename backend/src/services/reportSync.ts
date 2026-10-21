import { neo4jDriver } from "../config/neo4j.js";
import { generateEmbedding } from "./embedding.js";

interface ReportForSync {
  reportId: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  accountId: number;
  username: string;
  platformId: number;
  platformName: string;
}

export async function syncReportToNeo4j(
  report: ReportForSync
): Promise<void> {
  const text = `${report.title}. ${report.description}`;
  const embedding = await generateEmbedding(text);

  const session = neo4jDriver.session({ database: "neo4j" });

  try {
    await session.run(
      `MERGE (a:Account {accountId: $accountId})
       SET a.username = $username

       MERGE (p:Platform {platformId: $platformId})
       SET p.name = $platformName

       MERGE (a)-[:ON_PLATFORM]->(p)

       MERGE (r:Report {reportId: $reportId})
       SET r.title = $title,
           r.description = $description,
           r.severity = $severity,
           r.status = $status,
           r.embedding = $embedding

       MERGE (r)-[:TARGETS]->(a)`,
      {
        ...report,
        embedding,
      }
    );
  } finally {
    await session.close();
  }
}


export async function syncReportStatusToNeo4j(
  reportId: number,
  status: string
): Promise<void> {
  const session = neo4jDriver.session({ database: "neo4j" });

  try {
    await session.run(
      `MATCH (r:Report {reportId: $reportId})
       SET r.status = $status`,
      { reportId, status }
    );
  } finally {
    await session.close();
  }
}
