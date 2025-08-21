import { NextRequest, NextResponse } from "next/server";
import { snapshotDownload } from "@huggingface/hub";
import archiver from "archiver";
import { PassThrough } from "stream";
import { cookies } from "next/headers";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";

export async function GET(
  request: NextRequest,
  { params }: { params: { namespace: string; repoId: string } }
) {
  const { namespace, repoId } = params;
  const { searchParams } = new URL(request.url);
  const isPrivate = searchParams.get("private") === "true";

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(MY_TOKEN_KEY())?.value;

    const repoPath = await snapshotDownload({
      repo: `${namespace}/${repoId}`,
      repoType: "space",
      private: isPrivate,
      token,
    });

    const stream = new PassThrough();
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(stream);
    archive.directory(repoPath, false);
    await archive.finalize();

    return new NextResponse(stream as unknown as ReadableStream<Uint8Array>, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${repoId}.zip"`,
        "Content-Type": "application/zip",
      },
    });
  } catch (error) {
    console.error("Failed to download or zip repository:", error);
    return new NextResponse("Failed to download repository", { status: 500 });
  }
}
