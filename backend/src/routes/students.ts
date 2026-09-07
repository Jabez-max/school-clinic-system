import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

const router = Router();

// 👇 BINAGO: Gumagamit na ng environment variable para sa JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_clinic_key_2026';

// Middleware for universal authentication & RBAC context
const authenticateAndAuthorize = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) return res.status(403).json({ error: 'Account inactive or not found' });

    req.user = user;
    if (user.role === 'STUDENT') {
      const patient = await prisma.patient.findUnique({ where: { idNumber: user.schoolId } });
      req.patient = patient;
    }
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticateAndAuthorize);

// =====================================================================
// GET: LIST STUDENTS 
// =====================================================================
router.get('/', async (req: any, res: any) => {
  try {
    if (req.user.role === 'STUDENT') {
      return res.status(403).json({ error: 'Forbidden: Students cannot access the directory' });
    }

    const { page = 1, limit = 10, search = '', grade, section, status, sortOrder = 'asc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let whereClause: any = { type: 'STUDENT' }; // Ensure we only get students

    // HEAD TEACHER Isolation
    if (req.user.role === 'HEAD_TEACHER') {
      if (!req.user.handledGrade || !req.user.handledSection) {
        return res.json({ students: [], total: 0, page: 1, totalPages: 0 }); 
      }
      whereClause.gradeLevel = req.user.handledGrade;
      whereClause.section = req.user.handledSection;
    } else {
      if (grade) whereClause.gradeLevel = grade;
      if (section) whereClause.section = section;
    }

    if (search) {
      whereClause.OR = [
        { idNumber: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by Archive/Active status using the User table link
    if (status === 'ARCHIVED' || status === 'ACTIVE') {
      const isActiveFilter = status === 'ACTIVE';
      const relatedUsers = await prisma.user.findMany({
        where: { role: 'STUDENT', isActive: isActiveFilter },
        select: { schoolId: true }
      });
      whereClause.idNumber = { in: relatedUsers.map(u => u.schoolId) };
    }

    // Fetch Patients
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        orderBy: { lastName: sortOrder as any },
        skip,
        take
      }),
      prisma.patient.count({ where: whereClause })
    ]);

    // Manually map active status from User table since there's no direct relation
    const userStatuses = await prisma.user.findMany({
      where: { schoolId: { in: patients.map(p => p.idNumber) } },
      select: { schoolId: true, isActive: true }
    });

    const students = patients.map(patient => {
      const userMatch = userStatuses.find(u => u.schoolId === patient.idNumber);
      return {
        ...patient,
        user: { isActive: userMatch ? userMatch.isActive : false }
      };
    });

    res.json({
      students,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / take)
    });
  } catch (error) {
    console.error('[BACKEND] Fetch Students Error:', error);
    res.status(500).json({ error: 'Failed to retrieve students' });
  }
});

// =====================================================================
// POST: ADD NEW STUDENT
// =====================================================================
router.post('/', async (req: any, res: any) => {
  try {
    if (req.user.role !== 'NURSE') {
      return res.status(403).json({ error: 'Forbidden: Only Nurses can add students' });
    }

    const data = req.body;
    if (!data.idNumber || !data.firstName || !data.lastName || !data.gradeLevel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await prisma.user.findUnique({ where: { schoolId: data.idNumber } });
    if (existing) return res.status(400).json({ error: 'Student ID already exists' });

    const hashedPassword = await bcrypt.hash(data.idNumber, 10);
    
    // Create User (FIXED: Added email)
    const newUser = await prisma.user.create({
      data: {
        schoolId: data.idNumber,
        email: data.email || `${data.idNumber}@clinic.system`, 
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'STUDENT',
        isActive: true
      }
    });

    // Create Patient Profile (FIXED: Added type, mapped contactNo, removed user-relation)
    const newPatient = await prisma.patient.create({
      data: {
        idNumber: data.idNumber,
        type: 'STUDENT',
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        gradeLevel: data.gradeLevel,
        section: data.section,
        contactNo: data.emergencyContactNumber || null,
      }
    });

    // Initialize blank health record
    await prisma.healthRecord.create({
      data: { patientId: newPatient.id }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'CREATE_STUDENT', details: `Added new student: ${data.idNumber}` }
    });

    res.status(201).json({ message: 'Student created successfully', student: newPatient });
  } catch (error) {
    console.error('[BACKEND] Create Student Error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// =====================================================================
// GET: VIEW STUDENT PROFILE
// =====================================================================
router.get('/:id', async (req: any, res: any) => {
  try {
    const studentId = req.params.id;

    // FIXED: Removed include: { user } since it doesn't exist on Patient
    const student = await prisma.patient.findUnique({
      where: { id: studentId }
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // IDOR & RBAC
    if (req.user.role === 'STUDENT' && req.patient.id !== student.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own profile' });
    }
    if (req.user.role === 'HEAD_TEACHER') {
      if (student.gradeLevel !== req.user.handledGrade || student.section !== req.user.handledSection) {
        return res.status(403).json({ error: 'Forbidden: Student not in your assigned class' });
      }
    }

    // Fetch user manually to get active status
    const user = await prisma.user.findFirst({ where: { schoolId: student.idNumber } });

    const [visitCount, activeRequest] = await Promise.all([
      prisma.clinicVisit.count({ where: { patientId: student.id } }),
      prisma.clinicRequest.findFirst({
        where: { patientId: student.id, status: { in: ['PENDING', 'APPROVED'] } },
        orderBy: { requestDate: 'desc' }
      })
    ]);

    res.json({ 
      student: { ...student, user: { isActive: user ? user.isActive : false } }, 
      summary: { visitCount, activeRequest } 
    });
  } catch (error) {
    console.error('[BACKEND] View Student Error:', error);
    res.status(500).json({ error: 'Failed to retrieve student profile' });
  }
});

// =====================================================================
// PATCH: ARCHIVE (SOFT-DELETE) STUDENT
// =====================================================================
router.patch('/:id/archive', async (req: any, res: any) => {
  try {
    if (req.user.role !== 'NURSE') {
      return res.status(403).json({ error: 'Forbidden: Only Nurses can archive students' });
    }

    const student = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // FIXED: Use idNumber to find the related User
    const user = await prisma.user.findFirst({ where: { schoolId: student.idNumber } });
    if (!user) return res.status(404).json({ error: 'User account not found' });

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'ARCHIVE_STUDENT', details: `Archived student: ${student.idNumber}` }
    });

    res.json({ message: 'Student archived successfully' });
  } catch (error) {
    console.error('[BACKEND] Archive Student Error:', error);
    res.status(500).json({ error: 'Failed to archive student' });
  }
});

export default router;