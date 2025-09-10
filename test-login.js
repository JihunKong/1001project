// Simple script to test the /api/auth/test-login endpoint
// Usage: node test-login.js <email>

const readline = require('readline');

const testAccounts = [
  'test.learner@local.dev',
  'test.teacher@local.dev', 
  'test.admin@local.dev'
];

async function testLogin(email) {
  console.log(`🔄 Testing login for: ${email}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/test-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Login successful!`);
      console.log(`   User: ${result.user.name} (${result.user.role})`);
      console.log(`   Redirect to: ${getRoleBasedDashboard(result.user.role)}`);
    } else {
      console.log(`❌ Login failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`💥 Network error: ${error.message}`);
  }
}

function getRoleBasedDashboard(role) {
  switch (role) {
    case 'LEARNER': return '/dashboard/learner';
    case 'TEACHER': return '/dashboard/teacher';
    case 'ADMIN': return '/admin';
    default: return '/dashboard';
  }
}

async function interactiveTest() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🧪 Test Login Interactive Mode');
  console.log('Available accounts:');
  testAccounts.forEach((email, i) => {
    console.log(`  ${i + 1}. ${email}`);
  });
  console.log();

  while (true) {
    const answer = await new Promise(resolve => {
      rl.question('Enter account number (1-3) or email, or "quit": ', resolve);
    });

    if (answer.toLowerCase() === 'quit') {
      break;
    }

    let email;
    if (['1', '2', '3'].includes(answer)) {
      email = testAccounts[parseInt(answer) - 1];
    } else if (answer.includes('@')) {
      email = answer;
    } else {
      console.log('Invalid input. Please try again.');
      continue;
    }

    await testLogin(email);
    console.log();
  }

  rl.close();
}

async function main() {
  const email = process.argv[2];
  
  if (email) {
    // Single test mode
    await testLogin(email);
  } else {
    // Interactive mode
    await interactiveTest();
  }
}

// Polyfill fetch for older Node.js versions
if (!globalThis.fetch) {
  console.log('⚠️  fetch is not available. Please use Node.js 18+ or run: npm install node-fetch');
  process.exit(1);
}

main().catch(console.error);