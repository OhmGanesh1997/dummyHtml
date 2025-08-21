import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { repoUrl } = await request.json();

  if (!repoUrl) {
    return NextResponse.json(
      { message: "GitHub repository URL is required.", ok: false },
      { status: 400 }
    );
  }

  try {
    const url = new URL(repoUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length < 2) {
      return NextResponse.json(
        { message: "Invalid GitHub repository URL.", ok: false },
        { status: 400 }
      );
    }
    const [owner, repo] = pathParts;

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/index.html`
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "Failed to fetch from GitHub repository.",
          ok: false,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");

    return NextResponse.json({ html: content, ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, ok: false },
      { status: 500 }
    );
  }
}
