const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

// All test accounts with their passwords
const testAccounts = [
  { email: 'volunteer@1001stories.org', password: 'volunteer123' },
  { email: 'learner@demo.1001stories.org', password: 'learner123' },
  { email: 'teacher@demo.1001stories.org', password: 'teacher123' },
  { email: 'admin@1001stories.org', password: 'admin123' },
  { email: 'institution@demo.1001stories.org', password: 'institution123' },
  { email: 'purusil55@gmail.com', password: 'alsk2004A!@#' }
];

async function generateBcryptHashes() {
  console.log('Generating bcrypt password hashes (SALT_ROUNDS: 12)...\n');

  const hashMapping = {};

  for (const account of testAccounts) {
    const hash = await bcrypt.hash(account.password, SALT_ROUNDS);
    hashMapping[account.email] = hash;
    console.log(`${account.email}: ${account.password}`);
    console.log(`Hash: ${hash}`);
    console.log(`Length: ${hash.length} characters\n`);
  }

  console.log('--- SQL UPDATE COMMANDS ---');
  for (const account of testAccounts) {
    const hash = hashMapping[account.email];
    console.log(`UPDATE users SET password = '${hash}' WHERE email = '${account.email}';`);
  }

  console.log('\n--- Verification Commands ---');
  for (const account of testAccounts) {
    console.log(`SELECT email, LENGTH(password) as password_length, LEFT(password, 10) as password_start FROM users WHERE email = '${account.email}';`);
  }
}

generateBcryptHashes().catch(console.error);