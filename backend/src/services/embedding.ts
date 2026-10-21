import { pipeline } from "@xenova/transformers";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

type FeatureExtractor = (
  text: string,
  options: {
    pooling: "mean";
    normalize: boolean;
  }
) => Promise<{ data: Float32Array | number[] }>;

let extractorPromise: Promise<FeatureExtractor> | undefined;

async function getExtractor(): Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      MODEL_NAME
    ) as unknown as Promise<FeatureExtractor>;
  }

  return extractorPromise;
}

export async function generateEmbedding(
  text: string
): Promise<number[]> {
  if (!text.trim()) {
    throw new Error("Cannot generate an embedding from empty text.");
  }

  const extractor = await getExtractor();

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}
