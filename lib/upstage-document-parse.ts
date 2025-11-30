import { logger } from './logger';

export interface DocumentParseResult {
  text: string;
  pageCount: number;
  metadata?: Record<string, unknown>;
}

export interface DocumentParseError {
  code: string;
  message: string;
}

export async function extractTextFromPDF(
  pdfBuffer: Buffer,
  filename: string = 'document.pdf'
): Promise<DocumentParseResult> {
  const apiKey = process.env.UPSTAGE_API_KEY;

  if (!apiKey) {
    logger.error('UPSTAGE_API_KEY not configured');
    throw new Error('UPSTAGE_API_KEY environment variable is not set');
  }

  const formData = new FormData();
  const uint8Array = new Uint8Array(pdfBuffer);
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  formData.append('document', blob, filename);
  formData.append('ocr', 'auto');
  formData.append('output_formats', '["text"]');

  try {
    logger.info('Starting Upstage Document Parse API call', {
      filename,
      fileSize: pdfBuffer.length,
    });

    const response = await fetch(
      'https://api.upstage.ai/v1/document-ai/document-parse',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Upstage API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      throw new Error(`Upstage API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    let extractedText = '';
    let pageCount = 0;

    if (result.content && result.content.text) {
      extractedText = result.content.text;
    } else if (result.elements && Array.isArray(result.elements)) {
      extractedText = result.elements
        .filter((el: { type: string; text?: string }) => el.type === 'text' || el.text)
        .map((el: { text: string }) => el.text)
        .join('\n\n');
    } else if (typeof result.text === 'string') {
      extractedText = result.text;
    }

    if (result.metadata?.page_count) {
      pageCount = result.metadata.page_count;
    } else if (result.pages && Array.isArray(result.pages)) {
      pageCount = result.pages.length;
    } else if (result.num_pages) {
      pageCount = result.num_pages;
    }

    logger.info('Upstage Document Parse completed', {
      filename,
      textLength: extractedText.length,
      pageCount,
    });

    return {
      text: extractedText.trim(),
      pageCount,
      metadata: result.metadata || {},
    };
  } catch (error) {
    logger.error('Failed to extract text from PDF', {
      filename,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function extractTextFromPDFWithFallback(
  pdfBuffer: Buffer,
  filename: string = 'document.pdf'
): Promise<DocumentParseResult | null> {
  try {
    return await extractTextFromPDF(pdfBuffer, filename);
  } catch (error) {
    logger.warn('PDF text extraction failed, returning null as fallback', {
      filename,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
