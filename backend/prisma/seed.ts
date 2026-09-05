import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Nagsisimula nang mag-seed sa database...')

  // Lahat sila ay may password na 'password123'
  const hashedPassword = await bcrypt.hash('password123', 10)

  // 1. Account ni Nurse Joy
  const nurse = await prisma.user.upsert({
    where: { schoolId: 'NURSE-001' },
    update: {},
    create: {
      schoolId: 'NURSE-001',
      email: 'nurse@school.edu',
      password: hashedPassword,
      firstName: 'Joy',
      lastName: 'Santos',
      role: 'NURSE',
      isActive: true
    },
  })
  console.log(`✅ Nagawa ang user account: ${nurse.firstName} (Nurse)`)

  // 2. Account ng Head Teacher
  const headTeacher = await prisma.user.upsert({
    where: { schoolId: 'HT-001' },
    update: {},
    create: {
      schoolId: 'HT-001',
      email: 'ht@school.edu',
      password: hashedPassword,
      firstName: 'Maria',
      lastName: 'Clara',
      role: 'HEAD_TEACHER',
      isActive: true
    },
  })
  console.log(`✅ Nagawa ang user account: ${headTeacher.firstName} (Head Teacher)`)

  // 3. Account ng Student (Para makapag-login din ang estudyante)
  const studentUser = await prisma.user.upsert({
    where: { schoolId: '2026-0001' },
    update: {},
    create: {
      schoolId: '2026-0001',
      email: 'student@school.edu',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      role: 'STUDENT',
      isActive: true
    },
  })
  console.log(`✅ Nagawa ang user account: ${studentUser.firstName} (Student)`)

  // 4. Record ng Student sa Patient Database
  const studentPatient = await prisma.patient.upsert({
    where: { idNumber: '2026-0001' },
    update: {},
    create: {
      idNumber: '2026-0001',
      type: 'STUDENT',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      gradeLevel: 'Grade 10',
      section: 'Rizal',
      gender: 'Male',
      dateOfBirth: new Date('2010-05-15'),
      contactNo: '09123456789'
    },
  })
  console.log(`✅ Nagawa ang patient record: ${studentPatient.firstName} ${studentPatient.lastName}`)

  console.log('✅ Seeding completed successfully! Ready na for login testing!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })