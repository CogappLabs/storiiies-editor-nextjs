import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

export interface TileGenerationResult {
  tempDir: string;
  tileDir: string;
  width: number;
  height: number;
}

export const generateIIIFTiles = async (
  buffer: Buffer,
  imageId: string,
  blobBaseUrl: string,
  tileSize = 512,
): Promise<TileGenerationResult> => {
  const tempDir = await mkdtemp(join(tmpdir(), "iiif-"));

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Could not determine image dimensions");
    }

    // Sharp appends the directory name to the id, so we only include the parent path
    const iiifId = `${blobBaseUrl}/iiif`;
    const tileDir = join(tempDir, imageId);

    await image
      .tile({
        size: tileSize,
        layout: "iiif3",
        id: iiifId,
      })
      .toFile(tileDir);

    // The manifest's painting body points at full/max, which sharp's level0
    // layout does not write.
    const fullMaxDir = join(tileDir, "full", "max", "0");
    await mkdir(fullMaxDir, { recursive: true });
    await sharp(buffer).jpeg().toFile(join(fullMaxDir, "default.jpg"));

    return {
      tempDir,
      tileDir,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw error;
  }
};

export const cleanupTempDir = async (tempDir: string): Promise<void> => {
  await rm(tempDir, { recursive: true });
};
