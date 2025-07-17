// src/app/api/themes/[...slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { contentType } from "mime-types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await context.params;
    const assetPath = slug.join("/");

    // Basic security check
    if (assetPath.includes("..")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const filePath = path.resolve(
      process.cwd(),
      "node_modules/reveal.js/dist/theme",
      assetPath
    );

    // Security: Ensure the final path is within the intended directory
    const themesDir = path.resolve(
      process.cwd(),
      "node_modules/reveal.js/dist/theme"
    );
    if (!filePath.startsWith(themesDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const fileContent = await fs.readFile(filePath);
    const mimeType =
      contentType(path.extname(assetPath)) || "application/octet-stream";

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
