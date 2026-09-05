import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECURE_CLINIC_KEY_2026';

// Middleware for universal authentication & RBAC
const authenticateAndAuthorize = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) return res.status(403).json({ error: 'Account inactive or not found' });

    req.user = user;
    if (user.role === 'STUDENT') {
      req.patient = await prisma.patient.findUnique({ where: { idNumber: user.schoolId } });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticateAndAuthorize);

// Helper: Conflict Detection (Double-booking Prevention)
const checkConflict = async (nurseId: string, startTime: Date, endTime: Date, excludeId?: string) => {
  const conflicts = await prisma.clinicRequest.count({
    where: {
      nurseId,
      status: { notIn: ['CANCELLED', 'REJECTED', 'NO_SHOW'] },
      id: excludeId ? { not: excludeId } : undefined,
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } }
      ]
    }
  });
  return conflicts > 0;
};

// ==========================================
// GET /api/appointments (List & Search & Filter)
// ==========================================
router.get('/', async (req: any, res: any) => {
  try {
    const { page = 1, limit = 10, search = '', status, dateFrom, dateTo } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let whereClause: any = {};

    // RBAC Isolation
    if (req.user.role === 'STUDENT') {
      whereClause.patientId = req.patient.id;
    } else if (req.user.role === 'HEAD_TEACHER') {
      if (!req.user.handledGrade || !req.user.handledSection) return res.json({ appointments: [], total: 0, page: 1, totalPages: 0 });
      whereClause.patient = { gradeLevel: req.user.handledGrade, section: req.user.handledSection };
    }

    if (status) whereClause.status = status;
    if (dateFrom && dateTo) {
      whereClause.appointmentDate = { gte: new Date(dateFrom), lte: new Date(dateTo) };
    }
    if (search) {
      whereClause.OR = [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [appointments, total] = await Promise.all([
      prisma.clinicRequest.findMany({
        where: whereClause,
        include: { 
          patient: { select: { idNumber: true, firstName: true, lastName: true, gradeLevel: true, section: true } },
          nurse: { select: { firstName: true, lastName: true } }
        },
        orderBy: { appointmentDate: 'asc' },
        skip,
        take
      }),
      prisma.clinicRequest.count({ where: whereClause })
    ]);

    // Privacy stripping
    const sanitized = appointments.map(appt => {
      if (req.user.role === 'HEAD_TEACHER') {
        const { notes, ...safe } = appt as any;
        return safe;
      }
      return appt;
    });

    res.json({ appointments: sanitized, total, page: Number(page), totalPages: Math.ceil(total / take) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
});

// ==========================================
// POST /api/appointments (Create)
// ==========================================
router.post('/', async (req: any, res: any) => {
  if (req.user.role !== 'NURSE') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const { patientId, type, reason, appointmentDate, startTime, endTime, notes } = req.body;
    if (!patientId || !appointmentDate || !startTime || !endTime) return res.status(400).json({ error: 'Missing required fields' });

    const sTime = new Date(startTime);
    const eTime = new Date(endTime);
    if (sTime >= eTime) return res.status(400).json({ error: 'End time must be after start time' });

    // Prevent Double-Booking
    const hasConflict = await checkConflict(req.user.id, sTime, eTime);
    if (hasConflict) return res.status(409).json({ error: 'Schedule conflict: The selected time slot overlaps with an existing appointment.' });

    const appointment = await prisma.clinicRequest.create({
      data: {
        patientId,
        nurseId: req.user.id,
        type: type || 'General Consultation',
        reason,
        appointmentDate: new Date(appointmentDate),
        startTime: sTime,
        endTime: eTime,
        status: 'APPROVED', // Direct scheduling by nurse
        notes
      },
      include: { patient: true }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'CREATE_APPOINTMENT', details: `Created appointment for ${appointment.patient.idNumber}` }
    });

    res.status(201).json({ message: 'Appointment scheduled successfully', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
});

// ==========================================
// PATCH /api/appointments/:id/status (Workflow)
// ==========================================
router.patch('/:id/status', async (req: any, res: any) => {
  if (req.user.role !== 'NURSE') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { status, cancellationReason } = req.body;
    const validStatuses = ['PENDING', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'RESCHEDULED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const appt = await prisma.clinicRequest.update({
      where: { id: req.params.id },
      data: { status, cancellationReason: status === 'CANCELLED' ? cancellationReason : null }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'UPDATE_APPOINTMENT_STATUS', details: `Appointment ${appt.id} changed to ${status}` }
    });

    res.json({ message: 'Status updated', appointment: appt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ==========================================
// POST /api/appointments/:id/clinic-visit (Integration)
// ==========================================
router.post('/:id/clinic-visit', async (req: any, res: any) => {
  if (req.user.role !== 'NURSE') return res.status(403).json({ error: 'Forbidden' });
  try {
    const appt = await prisma.clinicRequest.findUnique({ where: { id: req.params.id } });
    if (!appt || appt.status === 'CANCELLED') return res.status(400).json({ error: 'Invalid or cancelled appointment' });
    if (appt.clinicVisitId) return res.status(400).json({ error: 'This appointment is already associated with a clinic visit' });

    // Create the clinic visit from the appointment data
    const visit = await prisma.clinicVisit.create({
      data: {
        patientId: appt.patientId,
        nurseId: req.user.id,
        visitType: appt.type,
        reason: appt.reason,
        status: 'IN_CONSULTATION'
      }
    });

    // Link it back and mark appointment completed
    await prisma.clinicRequest.update({
      where: { id: appt.id },
      data: { clinicVisitId: visit.id, status: 'COMPLETED' }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'APPOINTMENT_TO_VISIT', details: `Converted appointment ${appt.id} to visit ${visit.id}` }
    });

    res.json({ message: 'Clinic visit started', visitId: visit.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start clinic visit' });
  }
});

export default router;