// Test script for publishing flow
// This will test the complete text submission workflow

const API_BASE = 'http://localhost:8001';

// Test data
const testSubmission = {
  title: "My First Cultural Story",
  content: "<p>This is a beautiful story about my grandmother's wisdom. She taught me that <strong>kindness</strong> is the most important virtue.</p><p>Every morning, she would tell me stories of our ancestors and their traditions. These stories shaped who I am today.</p>",
  authorAlias: "Cultural Storyteller",
  summary: "A heartwarming story about generational wisdom and cultural traditions passed down through storytelling.",
  language: "en",
  ageRange: "13-18",
  category: ["family", "tradition"],
  tags: ["wisdom", "grandmother", "culture", "tradition"],
  copyrightConfirmed: true,
  originalWork: true,
  licenseType: "CC BY-SA 4.0"
};

async function testPublishingFlow() {
  console.log('🧪 Testing Publishing Flow...\n');

  try {
    // Step 1: Test health endpoint
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const health = await healthResponse.json();
    console.log('✅ Health Check:', health);

    // Step 2: Check authentication requirement
    console.log('\n📝 Testing Text Submissions API...');
    const submissionResponse = await fetch(`${API_BASE}/api/text-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSubmission)
    });

    console.log('Status:', submissionResponse.status);
    const result = await submissionResponse.text();
    console.log('Response:', result.substring(0, 200) + '...');

    if (submissionResponse.status === 401) {
      console.log('🔐 Authentication required (expected)');
      console.log('✅ API is properly secured');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPublishingFlow();