import { generateEmbedding } from "./services/embedding.js";

async function testEmbedding() {
  try {
    const embedding = await generateEmbedding(
      "A fake bank support account is attempting to steal user credentials."
    );

    console.log("Embedding dimensions:", embedding.length);
    console.log("First 5 values:", embedding.slice(0, 5));
    console.log("All values are finite:", embedding.every(Number.isFinite));
  } catch (error) {
    console.error("Embedding test failed:", error);
    process.exitCode = 1;
  }
}

testEmbedding();
