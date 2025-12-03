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
  console.log('[IMAGE-GEN] Starting generateImage function', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
  });

  if (!apiKey) {
    logger.error('[IMAGE-GEN] GOOGLE_GENAI_API_KEY not set in environment');
    console.error('[IMAGE-GEN] GOOGLE_GENAI_API_KEY not set in environment');
    return {
      success: false,
      error: 'GOOGLE_GENAI_API_KEY is not set in environment variables'
    };
  }

  try {
    logger.info('[IMAGE-GEN] Initializing Google GenAI client');
    console.log('[IMAGE-GEN] Initializing Google GenAI client');

    const ai = new GoogleGenAI({ apiKey });

    const stylePrompts: Record<string, string> = {
      'cute-cartoon': 'cute cartoon style for children, kawaii, bright colors, simple shapes, friendly characters, safe for kids',
      'realistic': 'realistic style, detailed, photorealistic',
      'illustration': 'illustrated style, artistic, colorful',
      'anime': 'anime style, Japanese animation, vibrant colors'
    };

    const style = options.style || 'cute-cartoon';
    const styleModifier = stylePrompts[style];
    const enhancedPrompt = `${options.prompt}, ${styleModifier}`;

    logger.info('[IMAGE-GEN] Sending request to gemini-2.5-flash-image', {
      prompt: enhancedPrompt.substring(0, 150),
      model: 'gemini-2.5-flash-image',
      promptLength: enhancedPrompt.length
    });
    console.log('[IMAGE-GEN] Sending request to gemini-2.5-flash-image');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: enhancedPrompt,
      config: {
        responseModalities: ["image", "text"],
      },
    });

    logger.info('[IMAGE-GEN] Received response from gemini-2.5-flash-image', {
      hasCandidates: !!response.candidates,
      candidatesCount: response.candidates?.length || 0
    });
    console.log('[IMAGE-GEN] Response received, candidates:', response.candidates?.length || 0);

    if (!response.candidates || response.candidates.length === 0) {
      logger.error('[IMAGE-GEN] No image candidates returned from Google GenAI', {
        responseKeys: Object.keys(response || {}),
        fullResponse: JSON.stringify(response).substring(0, 500)
      });
      console.error('[IMAGE-GEN] No candidates in response:', JSON.stringify(response).substring(0, 300));
      throw new Error("No image candidates returned from Google GenAI");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      logger.error('[IMAGE-GEN] No content parts in candidate', {
        hasContent: !!candidate.content,
        candidateKeys: Object.keys(candidate || {})
      });
      console.error('[IMAGE-GEN] No content parts in candidate');
      throw new Error("No content parts in candidate");
    }

    logger.info('[IMAGE-GEN] Processing response parts', {
      partsCount: candidate.content.parts.length,
      partTypes: candidate.content.parts.map(p => Object.keys(p))
    });
    console.log('[IMAGE-GEN] Parts count:', candidate.content.parts.length);

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");

        logger.info('[IMAGE-GEN] Image data extracted', {
          sizeBytes: buffer.length,
          base64Length: imageData.length
        });
        console.log('[IMAGE-GEN] Image data extracted, size:', buffer.length);

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
            console.log('[IMAGE-GEN] Image saved to:', options.outputPath);
          } catch (writeError) {
            logger.error('[IMAGE-GEN] Failed to write image file', writeError, {
              path: options.outputPath,
              directory
            });
            console.error('[IMAGE-GEN] Failed to write file:', writeError);
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
    console.error('[IMAGE-GEN] No image data in parts');
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
    console.error('[IMAGE-GEN] Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[IMAGE-GEN] Stack:', error instanceof Error ? error.stack : undefined);
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
