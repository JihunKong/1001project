// Bcrypt hash generator for 1001 Stories authentication
const bcrypt = require('bcryptjs');

// Use same salt rounds as the app
const SALT_ROUNDS = 12;

// Generate hashes for admin and writer accounts only
const passwords = {
  'writer123': null,  // WRITER role - allowed for password login
  'admin123': null,   // ADMIN role - allowed for password login
};

async function generateBcryptHashes() {
  console.log('Generating bcrypt password hashes (SALT_ROUNDS: 12)...\n');

  for (const [password, _] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    passwords[password] = hash;
    console.log(`${password}: ${hash}`);
  }

  console.log('\n--- SQL Update Commands ---');
  console.log(`UPDATE users SET password = '${passwords['writer123']}' WHERE email = 'writer@1001stories.org';`);
  console.log(`UPDATE users SET password = '${passwords['admin123']}' WHERE email = 'admin@1001stories.org';`);

  console.log('\n--- Note ---');
  console.log('Only ADMIN and WRITER roles can use password login.');
  console.log('LEARNER and TEACHER accounts should use magic link authentication.');
}

generateBcryptHashes().catch(console.error);