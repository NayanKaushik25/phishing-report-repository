
import "dotenv/config";
import { neo4jDriver } from "./config/neo4j.js";

async function testConnection() {
  const session = neo4jDriver.session({ database: "neo4j" });

  try {
    const result = await session.run(
      "MATCH (r:Report) RETURN count(r) AS count"
    );

    console.log(
      "Reports in phishing database:",
      result.records[0].get("count").toString()
    );
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    await session.close();
    await neo4jDriver.close();
  }
}

testConnection();
