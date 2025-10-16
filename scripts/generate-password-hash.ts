import bcrypt from 'bcryptjs';

const password = 'test123';
const saltRounds = 12;

async function generateHash() {
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}

generateHash();