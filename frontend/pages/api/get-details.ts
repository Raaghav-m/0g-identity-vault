import { Indexer } from "@0glabs/0g-ts-sdk";
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

const indexer = new Indexer("https://indexer-storage-testnet-standard.0g.ai");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { rootHash } = req.query;

    // Validate rootHash
    if (!rootHash || typeof rootHash !== "string") {
      return res.status(400).json({ error: "Root hash is required" });
    }

    // Download the file using the indexer
    const outputPath = path.join(process.cwd(), "temp", "output.json");
    const err = await indexer.download(rootHash, outputPath, false);

    if (err !== null) {
      throw err;
    }

    // Read the downloaded file
    const fileContent = await fs.readFile(outputPath, "utf-8");
    const data = JSON.parse(fileContent);

    // Clean up - delete the temporary file
    await fs.unlink(outputPath);

    return res.status(200).json(data);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Failed to fetch details" });
  }
}
