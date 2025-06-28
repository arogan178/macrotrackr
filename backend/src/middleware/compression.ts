// src/middleware/compression.ts
import { Elysia } from "elysia";
import { createGzip, createDeflate, createBrotliCompress } from "zlib";
import { Readable } from "stream";

/**
 * Response compression middleware for Elysia
 * Supports gzip, deflate, and brotli compression based on client Accept-Encoding header
 */

interface CompressionOptions {
  threshold?: number; // Minimum response size to compress (bytes)
  level?: number; // Compression level (1-9 for gzip/deflate, 1-11 for brotli)
  chunkSize?: number; // Chunk size for streaming compression
}

const DEFAULT_OPTIONS: CompressionOptions = {
  threshold: 1024, // 1KB minimum
  level: 6, // Balanced compression level
  chunkSize: 16384, // 16KB chunks
};

/**
 * Compress response data using the specified algorithm
 */
async function compressData(
  data: string | Buffer,
  encoding: string,
  options: CompressionOptions = DEFAULT_OPTIONS
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    let compressor;
    switch (encoding) {
      case "br":
        compressor = createBrotliCompress({
          chunkSize: options.chunkSize,
          params: {
            [require("zlib").constants.BROTLI_PARAM_QUALITY]: Math.min(
              options.level || 6,
              11
            ),
          },
        });
        break;
      case "gzip":
        compressor = createGzip({
          level: options.level || 6,
          chunkSize: options.chunkSize,
        });
        break;
      case "deflate":
        compressor = createDeflate({
          level: options.level || 6,
          chunkSize: options.chunkSize,
        });
        break;
      default:
        return resolve(buffer);
    }

    const chunks: Buffer[] = [];

    compressor.on("data", (chunk) => {
      chunks.push(chunk);
    });

    compressor.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    compressor.on("error", reject);

    // Create readable stream and pipe to compressor
    const readable = Readable.from(buffer);
    readable.pipe(compressor);
  });
}

/**
 * Get the best compression encoding based on Accept-Encoding header
 */
function getBestEncoding(acceptEncoding: string | null): string | null {
  if (!acceptEncoding) return null;

  const encodings = acceptEncoding
    .toLowerCase()
    .split(",")
    .map((e) => e.trim());

  // Priority order: brotli (best compression) > gzip > deflate
  if (encodings.some((e) => e.includes("br"))) return "br";
  if (encodings.some((e) => e.includes("gzip"))) return "gzip";
  if (encodings.some((e) => e.includes("deflate"))) return "deflate";

  return null;
}

/**
 * Check if content type should be compressed
 */
function shouldCompress(contentType: string | undefined): boolean {
  if (!contentType) return false;

  const compressibleTypes = [
    "text/",
    "application/json",
    "application/javascript",
    "application/xml",
    "application/rss+xml",
    "application/atom+xml",
    "image/svg+xml",
  ];

  return compressibleTypes.some((type) =>
    contentType.toLowerCase().includes(type)
  );
}

/**
 * Compression middleware for Elysia
 */
export const compressionMiddleware = (
  options: CompressionOptions = DEFAULT_OPTIONS
) => {
  return new Elysia({ name: "compression" }).onAfterHandle(
    { as: "scoped" },
    async (context: any) => {
      const { request, set, response } = context;

      // Skip compression if response is already compressed or not applicable
      if (set.headers["content-encoding"] || !response) {
        return;
      }

      // Get Accept-Encoding header
      const acceptEncoding = request.headers.get("accept-encoding");
      const encoding = getBestEncoding(acceptEncoding);

      if (!encoding) {
        return; // Client doesn't support compression
      }

      // Check content type
      const contentType = set.headers["content-type"] || "application/json";
      if (!shouldCompress(contentType)) {
        return; // Content type not suitable for compression
      }

      // Convert response to string/buffer
      let responseData: string | Buffer;
      if (typeof response === "string") {
        responseData = response;
      } else if (Buffer.isBuffer(response)) {
        responseData = response;
      } else {
        responseData = JSON.stringify(response);
        set.headers["content-type"] = "application/json;charset=utf-8";
      }

      // Check size threshold
      const dataSize = Buffer.byteLength(responseData);
      if (dataSize < (options.threshold || DEFAULT_OPTIONS.threshold!)) {
        return; // Response too small to benefit from compression
      }

      try {
        // Compress the response
        const compressedData = await compressData(
          responseData,
          encoding,
          options
        );

        // Only use compression if it actually reduces size
        if (compressedData.length < dataSize) {
          // Set compression headers
          set.headers["content-encoding"] = encoding;
          set.headers["content-length"] = compressedData.length.toString();
          set.headers["vary"] = set.headers["vary"]
            ? `${set.headers["vary"]}, Accept-Encoding`
            : "Accept-Encoding";

          // Return compressed data
          return new Response(compressedData, {
            status: set.status,
            headers: set.headers as Record<string, string>,
          });
        }
      } catch (error) {
        // Log compression error but don't fail the request
        console.warn("Compression failed:", error);
      }

      // Return original response if compression failed or didn't help
      return;
    }
  );
};
