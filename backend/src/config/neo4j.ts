import neo4j from "neo4j-driver";

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !username || !password) {
  throw new Error(
    "Missing Neo4j configuration. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.",
  );
}

export const neo4jDriver = neo4j.driver(
  uri,
  neo4j.auth.basic(username, password),
);
