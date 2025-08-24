import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, width = 1024, height = 1024, steps = 30 } = body;

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Missing prompt" },
        { status: 400 }
      );
    }

    // Get Stability AI API key from environment
    const stabilityApiKey = process.env.STABILITY_API_KEY;
    if (!stabilityApiKey) {
      return NextResponse.json(
        { ok: false, error: "Stability AI API key not configured" },
        { status: 500 }
      );
    }

    // Call Stability AI API
    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${stabilityApiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1,
            },
          ],
          cfg_scale: 7,
          height: height,
          width: width,
          samples: 1,
          steps: steps,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { 
          ok: false, 
          error: "Failed to generate image",
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the generated image data
    return NextResponse.json({
      ok: true,
      image: data.artifacts[0],
      base64: data.artifacts[0].base64,
    });

  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "An error occurred while generating the image",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
