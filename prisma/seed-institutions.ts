import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏫 Seeding institutions and departments...');

  console.log('🧹 Cleaning existing data...');
  await prisma.department.deleteMany({});
  await prisma.institution.deleteMany({});

  console.log('🌍 Creating demo institutions...');

  const seoulHighSchool = await prisma.institution.create({
    data: {
      name: 'Seoul International High School',
      code: 'SIHS2024',
      type: 'High School',
      location: 'Seoul',
      country: 'South Korea',
      timezone: 'Asia/Seoul',
      contactEmail: 'admin@sihs.edu',
      contactPhone: '+82-2-1234-5678',
      website: 'https://sihs.edu',
      maxTeachers: 100,
      maxStudents: 2000,
      maxClasses: 200,
      isActive: true,
      verifiedAt: new Date(),
    },
  });
  console.log(`✅ Created: ${seoulHighSchool.name}`);

  const nairobiAcademy = await prisma.institution.create({
    data: {
      name: 'Nairobi Learning Academy',
      code: 'NLA2024',
      type: 'Primary School',
      location: 'Nairobi',
      country: 'Kenya',
      timezone: 'Africa/Nairobi',
      contactEmail: 'info@nla.ke',
      contactPhone: '+254-20-1234567',
      website: 'https://nla.ke',
      maxTeachers: 50,
      maxStudents: 800,
      maxClasses: 80,
      isActive: true,
      verifiedAt: new Date(),
    },
  });
  console.log(`✅ Created: ${nairobiAcademy.name}`);

  const londonCollege = await prisma.institution.create({
    data: {
      name: 'London Community College',
      code: 'LCC2024',
      type: 'Community College',
      location: 'London',
      country: 'United Kingdom',
      timezone: 'Europe/London',
      contactEmail: 'contact@lcc.ac.uk',
      contactPhone: '+44-20-1234-5678',
      website: 'https://lcc.ac.uk',
      maxTeachers: 150,
      maxStudents: 3000,
      maxClasses: 300,
      isActive: true,
      verifiedAt: new Date(),
    },
  });
  console.log(`✅ Created: ${londonCollege.name}`);

  const mumbaiSchool = await prisma.institution.create({
    data: {
      name: 'Mumbai Education Center',
      code: 'MEC2024',
      type: 'Middle School',
      location: 'Mumbai',
      country: 'India',
      timezone: 'Asia/Kolkata',
      contactEmail: 'admin@mec.in',
      contactPhone: '+91-22-1234-5678',
      website: 'https://mec.in',
      maxTeachers: 80,
      maxStudents: 1500,
      maxClasses: 150,
      isActive: true,
      verifiedAt: new Date(),
    },
  });
  console.log(`✅ Created: ${mumbaiSchool.name}`);

  const saopauloInstitute = await prisma.institution.create({
    data: {
      name: 'São Paulo Learning Institute',
      code: 'SPLI2024',
      type: 'High School',
      location: 'São Paulo',
      country: 'Brazil',
      timezone: 'America/Sao_Paulo',
      contactEmail: 'contato@spli.br',
      contactPhone: '+55-11-1234-5678',
      website: 'https://spli.br',
      maxTeachers: 90,
      maxStudents: 1800,
      maxClasses: 180,
      isActive: true,
      verifiedAt: new Date(),
    },
  });
  console.log(`✅ Created: ${saopauloInstitute.name}`);

  console.log('\n🏢 Creating departments...');

  const dept1 = await prisma.department.create({
    data: {
      institutionId: seoulHighSchool.id,
      name: 'English Literature',
      code: 'ENG-LIT',
      description: 'Department of English Language and Literature',
    },
  });
  console.log(`✅ Created: ${dept1.name} (${seoulHighSchool.name})`);

  const dept2 = await prisma.department.create({
    data: {
      institutionId: seoulHighSchool.id,
      name: 'Mathematics',
      code: 'MATH',
      description: 'Mathematics and Computational Thinking',
    },
  });
  console.log(`✅ Created: ${dept2.name} (${seoulHighSchool.name})`);

  const dept3 = await prisma.department.create({
    data: {
      institutionId: nairobiAcademy.id,
      name: 'Primary Education',
      code: 'PRIM-EDU',
      description: 'Primary Level Education and Learning',
    },
  });
  console.log(`✅ Created: ${dept3.name} (${nairobiAcademy.name})`);

  const dept4 = await prisma.department.create({
    data: {
      institutionId: nairobiAcademy.id,
      name: 'Language Arts',
      code: 'LANG-ART',
      description: 'Language and Communication Skills',
    },
  });
  console.log(`✅ Created: ${dept4.name} (${nairobiAcademy.name})`);

  const dept5 = await prisma.department.create({
    data: {
      institutionId: londonCollege.id,
      name: 'Humanities',
      code: 'HUM',
      description: 'Humanities and Social Sciences',
    },
  });
  console.log(`✅ Created: ${dept5.name} (${londonCollege.name})`);

  const dept6 = await prisma.department.create({
    data: {
      institutionId: londonCollege.id,
      name: 'Adult Education',
      code: 'ADULT-EDU',
      description: 'Adult Learning and Professional Development',
    },
  });
  console.log(`✅ Created: ${dept6.name} (${londonCollege.name})`);

  const dept7 = await prisma.department.create({
    data: {
      institutionId: mumbaiSchool.id,
      name: 'General Studies',
      code: 'GEN-STD',
      description: 'Integrated General Studies Program',
    },
  });
  console.log(`✅ Created: ${dept7.name} (${mumbaiSchool.name})`);

  const dept8 = await prisma.department.create({
    data: {
      institutionId: saopauloInstitute.id,
      name: 'Portuguese Literature',
      code: 'PORT-LIT',
      description: 'Portuguese Language and Brazilian Literature',
    },
  });
  console.log(`✅ Created: ${dept8.name} (${saopauloInstitute.name})`);

  const dept9 = await prisma.department.create({
    data: {
      institutionId: saopauloInstitute.id,
      name: 'Science and Technology',
      code: 'SCI-TECH',
      description: 'Science, Technology, and Innovation',
    },
  });
  console.log(`✅ Created: ${dept9.name} (${saopauloInstitute.name})`);

  console.log('\n✨ Seeding completed!');
  console.log(`📊 Created ${5} institutions and ${9} departments`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding data:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
