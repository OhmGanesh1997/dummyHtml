# Stability AI Integration Setup

This guide explains how to set up Stability AI image generation in your DeepSite application.

## Prerequisites

1. A Stability AI account with API access
2. Your Stability AI API key

## Setup Instructions

### 1. Get Your Stability AI API Key

1. Go to [Stability AI Platform](https://platform.stability.ai/)
2. Sign up or log in to your account
3. Navigate to your account settings
4. Generate a new API key
5. Copy the API key for use in your application

### 2. Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
STABILITY_API_KEY=your_stability_ai_api_key_here
```

### 3. API Endpoints

The integration adds the following API endpoint:

- `POST /api/generate-image` - Generates images using Stability AI

### 4. How It Works

1. **Image Placeholders**: When the AI generates HTML, it includes special comments like:
   ```html
   <!-- STABILITY_AI_IMAGE: A modern hero section background with abstract geometric shapes -->
   <img src="data:image/png;base64,STABILITY_AI_PLACEHOLDER" alt="Generated background" />
   ```

2. **Automatic Processing**: The system automatically detects these placeholders and:
   - Extracts all image descriptions from the comments
   - Generates unique images for each placeholder (even if descriptions are similar)
   - Adds variation to prompts to ensure different images
   - Replaces each placeholder with its corresponding generated image

3. **Provider Selection**: Users can select "Stability AI" as their provider in the settings panel.

4. **Unique Image Generation**: Each placeholder gets a unique image, even if they have similar descriptions. The system adds variation to ensure diversity.

### 5. Configuration Options

The image generation supports the following parameters:

- `prompt` (required): Text description of the image to generate
- `width` (optional): Image width in pixels (default: 1024)
- `height` (optional): Image height in pixels (default: 1024)
- `steps` (optional): Number of generation steps (default: 30)

### 6. Error Handling

If image generation fails, the system will:
1. Log the error to the console
2. Replace the placeholder with a fallback SVG image
3. Continue processing the rest of the HTML

### 7. Usage Examples

The AI will automatically use Stability AI for images when you:

1. Select "Stability AI" as your provider
2. Ask for designs that include images
3. Request specific visual elements

Example prompts that will trigger image generation:
- "Create a landing page with a hero section"
- "Design a portfolio with background images"
- "Make a website with product photos"

### 8. Troubleshooting

**Common Issues:**

1. **API Key Not Found**: Ensure `STABILITY_API_KEY` is set in your environment variables
2. **Rate Limiting**: Stability AI has rate limits; check your account dashboard
3. **Image Generation Fails**: Check the browser console for detailed error messages

**Debug Mode:**

To enable debug logging, add this to your environment:
```bash
DEBUG_STABILITY_AI=true
```

### 9. Cost Considerations

- Stability AI charges per image generation
- Monitor your usage in the Stability AI dashboard
- Consider implementing usage limits for production applications

### 10. Security Notes

- Never expose your API key in client-side code
- The API key is only used server-side in the `/api/generate-image` route
- Consider implementing rate limiting for the image generation endpoint
