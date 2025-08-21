import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { space_id } = await request.json();

  if (!space_id) {
    return NextResponse.json(
      { message: "Space ID is required.", ok: false },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://huggingface.co/spaces/${space_id}/raw/main/index.html`
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch HTML from Hugging Face Space.", ok: false },
        { status: response.status }
      );
    }

    const html = await response.text();

    return NextResponse.json({ html, ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, ok: false },
      { status: 500 }
    );
  }
}
