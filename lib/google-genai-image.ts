import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from '@/lib/logger';

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
    logger.error('GOOGLE_GENAI_API_KEY not set in environment');
    return {
      success: false,
      error: 'GOOGLE_GENAI_API_KEY is not set in environment variables'
    };
  }

  try {
    logger.info('Initializing Google GenAI for image generation', {
      style: options.style || 'cute-cartoon',
      outputPath: options.outputPath
    });

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

    logger.info('Sending image generation request to Google GenAI', {
      prompt: enhancedPrompt.substring(0, 150),
      model: 'gemini-2.0-flash-exp'
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: enhancedPrompt,
    });

    logger.info('Received response from Google GenAI', {
      candidatesCount: response.candidates?.length || 0
    });

    if (!response.candidates || response.candidates.length === 0) {
      logger.error('No image candidates returned from Google GenAI');
      throw new Error("No image candidates returned from Google GenAI");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      logger.error('No content parts in candidate');
      throw new Error("No content parts in candidate");
    }

    logger.info('Processing response parts', {
      partsCount: candidate.content.parts.length
    });

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");

        logger.info('Image data extracted from response', {
          sizeBytes: buffer.length
        });

        if (options.outputPath) {
          const directory = path.dirname(options.outputPath);
          if (!fs.existsSync(directory)) {
            logger.info('Creating output directory', { directory });
            fs.mkdirSync(directory, { recursive: true });
          }

          fs.writeFileSync(options.outputPath, buffer);
          logger.info('Image saved successfully', {
            path: options.outputPath,
            sizeBytes: buffer.length
          });

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

    logger.error('No image data found in response parts');
    return {
      success: false,
      error: 'No image data in response'
    };

  } catch (error) {
    logger.error('Error generating image with Google GenAI', error, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      prompt: options.prompt.substring(0, 100)
    });
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
