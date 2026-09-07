import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();

// 👇 BINAGO: Gumagamit na ng environment variable para mag-match sa live server!
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
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticateAndAuthorize);

// =====================================================================
// GET: LIST CLINIC VISITS (With Server-Side Search, Pagination, & Privacy)
// =====================================================================
router.get('/', async (req: any, res: any) => {
  try {
    const { page = 1, limit = 10, search = '', status, visitType } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let whereClause: any = { isArchived: false };

    // STRICT ROLE ISOLATION
    if (req.user.role === 'STUDENT') {
      whereClause.patientId = req.patient.id; // Own visits only
    } else if (req.user.role === 'HEAD_TEACHER') {
      if (!req.user.handledGrade || !req.user.handledSection) {
        return res.json({ visits: [], total: 0, page: 1, totalPages: 0 }); // Block if no class assigned
      }
      whereClause.patient = { gradeLevel: req.user.handledGrade, section: req.user.handledSection };
    }

    if (status) whereClause.status = status;
    if (visitType) whereClause.visitType = visitType;
    if (search) {
      whereClause.OR = [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { idNumber: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [visits, total] = await Promise.all([
      prisma.clinicVisit.findMany({
        where: whereClause,
        include: { patient: { select: { idNumber: true, firstName: true, lastName: true, gradeLevel: true, section: true } } },
        orderBy: { visitDate: 'desc' },
        skip,
        take
      }),
      prisma.clinicVisit.count({ where: whereClause })
    ]);

    // DATA MINIMIZATION (Privacy-by-design): Strip clinical details for non-nurses
    const sanitizedVisits = visits.map(v => {
      if (req.user.role !== 'NURSE') {
        const { privateNotes, diagnosis, treatment, medicineUsed, ...safeData } = v as any;
        return safeData;
      }
      return v;
    });

    res.json({ visits: sanitizedVisits, total, page: Number(page), totalPages: Math.ceil(total / take) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve clinic visits' });
  }
});

// =====================================================================
// POST: CREATE CLINIC VISIT (NURSE ONLY)
// =====================================================================
router.post('/', async (req: any, res: any) => {
  if (req.user.role !== 'NURSE') return res.status(403).json({ error: 'Forbidden' });
  try {
    const data = req.body;
    if (!data.patientId || !data.reason) return res.status(400).json({ error: 'Missing required fields' });

    const visit = await prisma.clinicVisit.create({
      data: {
        patientId: data.patientId,
        nurseId: req.user.id,
        visitType: data.visitType || 'General Consultation',
        reason: data.reason,
        symptoms: data.symptoms,
        temperature: data.temperature ? parseFloat(data.temperature) : null,
        bloodPressure: data.bloodPressure || null,
        heartRate: data.heartRate ? parseInt(data.heartRate) : null,
        respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : null,
        oxygenSaturation: data.oxygenSaturation ? parseInt(data.oxygenSaturation) : null,
        height: data.height ? parseFloat(data.height) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        status: 'WAITING'
      }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'CREATE_CLINIC_VISIT', details: `Created visit for patient ID: ${data.patientId}` }
    });

    res.status(201).json({ message: 'Visit created', visit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create clinic visit' });
  }
});

// =====================================================================
// GET: VIEW SINGLE CLINIC VISIT
// =====================================================================
router.get('/:id', async (req: any, res: any) => {
  try {
    const visit: any = await prisma.clinicVisit.findUnique({
      where: { id: req.params.id },
      include: { 
        patient: true,
        nurse: { select: { firstName: true, lastName: true } }
      }
    });

    if (!visit || visit.isArchived) return res.status(404).json({ error: 'Visit not found' });

    // IDOR Protection
    if (req.user.role === 'STUDENT' && visit.patientId !== req.patient.id) return res.status(403).json({ error: 'Forbidden' });
    if (req.user.role === 'HEAD_TEACHER') {
      if (visit.patient.gradeLevel !== req.user.handledGrade || visit.patient.section !== req.user.handledSection) return res.status(403).json({ error: 'Forbidden' });
    }

    // Privacy stripping
    if (req.user.role !== 'NURSE') {
      delete visit.privateNotes;
      delete visit.diagnosis;
      delete visit.treatment;
    }

    res.json({ visit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visit' });
  }
});

// =====================================================================
// PATCH: UPDATE CLINICAL INFO (NURSE ONLY)
// =====================================================================
router.patch('/:id', async (req: any, res: any) => {
  if (req.user.role !== 'NURSE') return res.status(403).json({ error: 'Forbidden' });
  try {
    const data = req.body;
    
    // Prevent overriding secure system fields
    delete data.id; delete data.patientId; delete data.nurseId; delete data.status;

    const visit = await prisma.clinicVisit.update({
      where: { id: req.params.id },
      data
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'UPDATE_CLINIC_VISIT', details: `Updated clinical info for visit ID: ${visit.id}` }
    });

    res.json({ message: 'Updated successfully', visit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update visit' });
  }
});

// =====================================================================
// PATCH: UPDATE STATUS WITH WORKFLOW VALIDATION (NURSE ONLY)
// =====================================================================
router.patch('/:id/status', async (req: any, res: any) => {
  if (req.user.role !== 'NURSE') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { status } = req.body;
    const validStatuses = ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'REFERRED', 'EMERGENCY', 'CANCELLED'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const currentVisit = await prisma.clinicVisit.findUnique({ where: { id: req.params.id } });
    if (!currentVisit) return res.status(404).json({ error: 'Visit not found' });

    // Enforce completeness before closing a visit
    if (status === 'COMPLETED') {
      if (!currentVisit.diagnosis || !currentVisit.disposition) {
        return res.status(400).json({ error: 'Cannot complete visit. Assessment (Diagnosis) and Disposition are required.' });
      }
    }

    const visit = await prisma.clinicVisit.update({
      where: { id: req.params.id },
      data: { status }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'VISIT_STATUS_CHANGED', details: `Visit ${visit.id} status changed to ${status}` }
    });

    res.json({ message: 'Status updated', visit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;