import * as dotenv from 'dotenv';
import { generateCuteCartoonImage } from '../lib/google-genai-image';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function testImageGeneration() {
  console.log('Starting Google GenAI image generation test...\n');

  const testCases = [
    {
      prompt: 'A cute smiling book character reading to happy children',
      filename: 'cute-book-character.png'
    },
    {
      prompt: 'A friendly cartoon elephant playing with colorful balloons',
      filename: 'elephant-balloons.png'
    },
    {
      prompt: 'A cheerful sun with a happy face shining over a rainbow',
      filename: 'happy-sun-rainbow.png'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Generating image for: "${testCase.prompt}"`);

    const outputPath = path.join(
      process.cwd(),
      'public',
      'generated-images',
      testCase.filename
    );

    const result = await generateCuteCartoonImage(testCase.prompt, outputPath);

    if (result.success) {
      console.log(`✅ Success!`);
      console.log(`   File: ${outputPath}`);
      console.log(`   Base64 length: ${result.base64Data?.length || 0} characters\n`);
    } else {
      console.error(`❌ Failed: ${result.error}\n`);
    }
  }

  console.log('Test completed!');
}

testImageGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
