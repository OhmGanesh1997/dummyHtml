export interface StabilityAIImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
}

export interface StabilityAIImageResponse {
  ok: boolean;
  image?: any;
  base64?: string;
  error?: string;
  details?: any;
}

export async function generateStabilityAIImage(
  request: StabilityAIImageRequest
): Promise<StabilityAIImageResponse> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      ok: false,
      error: 'Failed to generate image',
      details: error.message,
    };
  }
}

export function extractImagePrompts(html: string): string[] {
  const stabilityImageRegex = /<!-- STABILITY_AI_IMAGE: ([^>]+) -->/g;
  const prompts: string[] = [];
  let match;

  while ((match = stabilityImageRegex.exec(html)) !== null) {
    prompts.push(match[1].trim());
  }

  return prompts;
}

export function replaceImagePlaceholders(
  html: string,
  imageData: { prompt: string; base64: string }[]
): string {
  let processedHtml = html;
  const stabilityImageRegex = /<!-- STABILITY_AI_IMAGE: ([^>]+) -->/g;
  let match;
  let imageIndex = 0;

  while ((match = stabilityImageRegex.exec(html)) !== null) {
    const imageInfo = imageData[imageIndex];
    
    if (imageInfo && imageInfo.base64) {
      // Replace only the next occurrence of the placeholder
      const placeholderRegex = /data:image\/png;base64,STABILITY_AI_PLACEHOLDER/;
      processedHtml = processedHtml.replace(placeholderRegex, `data:image/png;base64,${imageInfo.base64}`);
    }
    
    imageIndex++;
  }

  return processedHtml;
}
