# Google GenAI Image Generation Reference

This document provides the reference implementation for Google GenAI image generation using the latest `gemini-2.5-flash-image` model.

## Official Example Code

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {
  const ai = new GoogleGenAI({});

  const prompt =
    "A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's munching on a green bamboo leaf. The design features bold, clean outlines, simple cel-shading, and a vibrant color palette. The background must be white.";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("red_panda_sticker.png", buffer);
      console.log("Image saved as red_panda_sticker.png");
    }
  }
}

main();
```

## Current Implementation

Our current implementation is in `/lib/google-genai-image.ts` which:

- Supports different styles: `cute-cartoon`, `realistic`, `illustration`, `anime`
- Saves images to file system or returns base64 data
- Uses `gemini-2.5-flash-image` model
- Requires `GOOGLE_GENAI_API_KEY` environment variable

## Usage in 1001 Stories

For text submissions, we generate images automatically:

```typescript
import { generateCuteCartoonImage } from '@/lib/google-genai-image';

const result = await generateCuteCartoonImage(
  `Children's story illustration: ${title}. ${summary}`,
  `/public/generated-images/${submissionId}-1.png`
);
```

## Environment Variables

Required in `.env.local` and `.env.production`:

```env
GOOGLE_GENAI_API_KEY=your-api-key-here
```

## API Key Management

- API key provided by user
- Check if deleted during container updates
- Verify in production: `docker exec 1001-stories-app env | grep GOOGLE_GENAI_API_KEY`

## Model Information

- **Model**: `gemini-2.5-flash-image`
- **Provider**: Google GenAI
- **Response Format**: Base64 encoded image data
- **Supported Formats**: PNG (default)
