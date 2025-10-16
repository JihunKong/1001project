const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

// All test accounts with their passwords
const passwords = {
  'volunteer123': null,        // volunteer@1001stories.org
  'learner123': null,          // learner@*.1001stories.org
  'teacher123': null,          // teacher@*.1001stories.org
  'admin123': null,            // admin@1001stories.org
  'institution123': null,      // institution@*.1001stories.org
  'alsk2004A!@#': null        // purusil55@gmail.com (original password)
};

async function generateAllHashes() {
  console.log('Generating bcrypt password hashes for all test accounts...\n');

  for (const [password, _] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    passwords[password] = hash;
    console.log(`${password}: ${hash}`);
  }

  console.log('\n--- SQL Update Commands ---');
  console.log(`UPDATE users SET password = '${passwords['volunteer123']}' WHERE email = 'volunteer@1001stories.org';`);
  console.log(`UPDATE users SET password = '${passwords['learner123']}' WHERE email LIKE 'learner@%1001stories.org';`);
  console.log(`UPDATE users SET password = '${passwords['teacher123']}' WHERE email LIKE 'teacher@%1001stories.org';`);
  console.log(`UPDATE users SET password = '${passwords['admin123']}' WHERE email = 'admin@1001stories.org';`);
  console.log(`UPDATE users SET password = '${passwords['institution123']}' WHERE email LIKE 'institution@%1001stories.org';`);
  console.log(`UPDATE users SET password = '${passwords['alsk2004A!@#']}' WHERE email = 'purusil55@gmail.com';`);

  console.log('\n--- Individual Updates ---');
  console.log(`UPDATE users SET password = '${passwords['learner123']}' WHERE email = 'learner@*.1001stories.org';`);
  console.log(`UPDATE users SET password = '${passwords['teacher123']}' WHERE email = 'teacher@*.1001stories.org';`);
  console.log(`UPDATE users SET password = '${passwords['institution123']}' WHERE email = 'institution@*.1001stories.org';`);
}

generateAllHashes().catch(console.error);