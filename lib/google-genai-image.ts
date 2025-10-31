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

  logger.info('[IMAGE-GEN] Starting generateImage function', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    style: options.style || 'cute-cartoon',
    outputPath: options.outputPath
  });

  if (!apiKey) {
    logger.error('[IMAGE-GEN] GOOGLE_GENAI_API_KEY not set in environment');
    return {
      success: false,
      error: 'GOOGLE_GENAI_API_KEY is not set in environment variables'
    };
  }

  try {
    logger.info('[IMAGE-GEN] Initializing Google GenAI client');

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

    logger.info('[IMAGE-GEN] Sending request to Google GenAI', {
      prompt: enhancedPrompt.substring(0, 150),
      model: 'gemini-2.5-flash-image',
      promptLength: enhancedPrompt.length
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: enhancedPrompt,
    });

    logger.info('[IMAGE-GEN] Received response from Google GenAI', {
      hasCandidates: !!response.candidates,
      candidatesCount: response.candidates?.length || 0
    });

    if (!response.candidates || response.candidates.length === 0) {
      logger.error('[IMAGE-GEN] No image candidates returned from Google GenAI', {
        responseKeys: Object.keys(response || {}),
        fullResponse: JSON.stringify(response).substring(0, 500)
      });
      throw new Error("No image candidates returned from Google GenAI");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      logger.error('[IMAGE-GEN] No content parts in candidate', {
        hasContent: !!candidate.content,
        candidateKeys: Object.keys(candidate || {})
      });
      throw new Error("No content parts in candidate");
    }

    logger.info('[IMAGE-GEN] Processing response parts', {
      partsCount: candidate.content.parts.length,
      partTypes: candidate.content.parts.map(p => Object.keys(p))
    });

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");

        logger.info('[IMAGE-GEN] Image data extracted', {
          sizeBytes: buffer.length,
          base64Length: imageData.length
        });

        if (options.outputPath) {
          const directory = path.dirname(options.outputPath);
          logger.info('[IMAGE-GEN] Checking output directory', {
            directory,
            exists: fs.existsSync(directory)
          });

          if (!fs.existsSync(directory)) {
            logger.info('[IMAGE-GEN] Creating output directory', { directory });
            fs.mkdirSync(directory, { recursive: true });
          }

          try {
            fs.writeFileSync(options.outputPath, buffer);
            logger.info('[IMAGE-GEN] Image saved successfully', {
              path: options.outputPath,
              sizeBytes: buffer.length
            });
          } catch (writeError) {
            logger.error('[IMAGE-GEN] Failed to write image file', writeError, {
              path: options.outputPath,
              directory
            });
            throw writeError;
          }

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

    logger.error('[IMAGE-GEN] No image data found in response parts', {
      partsCount: candidate.content.parts.length,
      partKeys: candidate.content.parts.map(p => Object.keys(p))
    });
    return {
      success: false,
      error: 'No image data in response'
    };

  } catch (error) {
    logger.error('[IMAGE-GEN] Error generating image with Google GenAI', error, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : typeof error,
      prompt: options.prompt.substring(0, 100),
      outputPath: options.outputPath
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
