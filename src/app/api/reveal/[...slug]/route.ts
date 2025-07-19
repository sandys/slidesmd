import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { contentType } from "mime-types";
import sass from "sass";

export async function GET(
  request: NextRequest,
  context: { params: { slug: string[] } }
) {
  try {
    const { slug } = context.params;
    const assetPath = slug.join("/");

    if (assetPath.includes("..")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const revealRoot = path.resolve(process.cwd(), "node_modules/reveal.js");

    // Special handling for the print stylesheet which only exists as SCSS
    if (assetPath === "css/print/pdf.css") {
      const scssPath = path.join(revealRoot, "css/print/pdf.scss");
      try {
        const result = sass.compile(scssPath, { style: "compressed" });
        return new NextResponse(result.css, {
          status: 200,
          headers: {
            "Content-Type": "text/css",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch (e) {
        console.error("Failed to compile reveal print css", e);
        return new NextResponse("Internal Server Error", { status: 500 });
      }
    }

    const filePath = path.resolve(revealRoot, assetPath);
    if (!filePath.startsWith(revealRoot)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const fileContent = await fs.readFile(filePath);
    const mimeType = contentType(path.extname(assetPath)) || "application/octet-stream";

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
