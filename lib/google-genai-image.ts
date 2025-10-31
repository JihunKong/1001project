import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

interface GenerateImageOptions {
  prompt: string;
  outputPath?: string;
  style?: 'cute-cartoon' | 'realistic' | 'illustration' | 'anime';
}

interface GenerateImageResult {
  success: boolean;
  filePath?: string;
  base64Data?: string;
  error?: string;
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'GOOGLE_GENAI_API_KEY is not set in environment variables'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const stylePrompts: Record<string, string> = {
      'cute-cartoon': 'cute cartoon style, kawaii, bright colors, simple shapes, friendly characters',
      'realistic': 'realistic style, detailed, photorealistic',
      'illustration': 'illustrated style, artistic, colorful',
      'anime': 'anime style, Japanese animation, vibrant colors'
    };

    const style = options.style || 'cute-cartoon';
    const styleModifier = stylePrompts[style];
    const enhancedPrompt = `${options.prompt}, ${styleModifier}`;

    console.log(`[GoogleGenAI] Generating image with prompt: "${enhancedPrompt}"`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: enhancedPrompt,
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No image candidates returned from Google GenAI");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      throw new Error("No content parts in candidate");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");

        if (options.outputPath) {
          const directory = path.dirname(options.outputPath);
          if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
          }

          fs.writeFileSync(options.outputPath, buffer);
          console.log(`[GoogleGenAI] Image saved to: ${options.outputPath}`);

          return {
            success: true,
            filePath: options.outputPath,
            base64Data: imageData
          };
        }

        return {
          success: true,
          base64Data: imageData
        };
      }
    }

    return {
      success: false,
      error: 'No image data in response'
    };

  } catch (error) {
    console.error('[GoogleGenAI] Error generating image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function generateCuteCartoonImage(
  prompt: string,
  outputPath?: string
): Promise<GenerateImageResult> {
  return generateImage({
    prompt,
    outputPath,
    style: 'cute-cartoon'
  });
}
