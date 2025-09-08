#!/bin/bash

# Test Users Seed Script
# Creates test users for the education platform testing environment

set -e

echo "Starting test users seed script..."

# Wait for database to be ready
until PGPASSWORD=test_pass_2024 psql -h postgres-test -U test_user -d stories_test_db -c '\q'; do
  echo "Waiting for database..."
  sleep 2
done

echo "Database is ready. Running Prisma migrations..."

# Run Prisma migrations
cd /app
npx prisma migrate deploy || echo "Migrations may already be applied"

# Generate Prisma client
npx prisma generate

# Create seed script for test users
cat > /tmp/seed-test-users.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test users...');

  // Hash passwords
  const teacherPassword = await bcrypt.hash('Test123!', 10);
  const studentPassword = await bcrypt.hash('Student123!', 10);

  // Create teacher account
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@test.edu' },
    update: {},
    create: {
      email: 'teacher@test.edu',
      name: 'Test Teacher',
      password: teacherPassword,
      role: 'TEACHER',
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Test',
          lastName: 'Teacher',
          bio: 'Test teacher account for education platform testing'
        }
      }
    },
  });

  console.log('Created teacher:', teacher.email);

  // Create student accounts
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@test.edu' },
    update: {},
    create: {
      email: 'student1@test.edu',
      name: 'Student One',
      password: studentPassword,
      role: 'LEARNER',
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Student',
          lastName: 'One',
          bio: 'Test student account 1'
        }
      }
    },
  });

  console.log('Created student1:', student1.email);

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@test.edu' },
    update: {},
    create: {
      email: 'student2@test.edu',
      name: 'Student Two',
      password: studentPassword,
      role: 'LEARNER',
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Student',
          lastName: 'Two',
          bio: 'Test student account 2'
        }
      }
    },
  });

  console.log('Created student2:', student2.email);

  // Create admin account
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.edu' },
    update: {},
    create: {
      email: 'admin@test.edu',
      name: 'Test Admin',
      password: await bcrypt.hash('Admin123!', 10),
      role: 'ADMIN',
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Test',
          lastName: 'Admin',
          bio: 'Test admin account'
        }
      }
    },
  });

  console.log('Created admin:', admin.email);

  console.log('Test users seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding test users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

# Run the seed script
npx tsx /tmp/seed-test-users.ts || echo "Test users may already exist"

echo "Test users seed script completed!"