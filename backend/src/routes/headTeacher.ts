import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();
const JWT_SECRET = 'SUPER_SECURE_CLINIC_KEY_2026';

// Middleware: Authenticate & Verify HEAD_TEACHER Role
const requireHeadTeacher = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'HEAD_TEACHER') {
      return res.status(403).json({ error: 'Forbidden: Access restricted to Head Teachers only' });
    }
    
    // Kunin ang pinakabagong impormasyon ng guro sa database
    const teacher = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        handledGrade: true,
        handledSection: true,
        isActive: true,
      }
    });

    if (!teacher || !teacher.isActive) {
      return res.status(403).json({ error: 'Account inactive or not found' });
    }

    req.teacher = teacher;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
};

// 1. GET /api/head-teacher/dashboard — Buong Dashboard Summary
router.get('/dashboard', requireHeadTeacher, async (req: any, res: any) => {
  try {
    const { id: teacherId, handledGrade, handledSection, firstName, lastName } = req.teacher;

    const gradeFilter = handledGrade || '';
    const sectionFilter = handledSection || '';

    // A. Query Assigned Students
    const studentsWhere: any = {};
    if (gradeFilter) studentsWhere.gradeLevel = gradeFilter;
    if (sectionFilter) studentsWhere.section = sectionFilter;

    const [
      totalAssignedCount,
      myStudents,
      inClinicVisits,
      pendingReferrals,
      recentReferrals,
      clinicRequests,
      announcements,
      recentActivities
    ] = await Promise.all([
      // 1. Bilang ng assigned students
      prisma.patient.count({ where: studentsWhere }),

      // 2. Listahan ng mga estudyante (Top 10 preview)
      prisma.patient.findMany({
        where: studentsWhere,
        take: 10,
        orderBy: { lastName: 'asc' },
        select: {
          id: true,
          idNumber: true,
          firstName: true,
          lastName: true,
          gradeLevel: true,
          section: true,
          gender: true,
        }
      }),

      // 3. Mga estudyanteng kasalukuyang nasa clinic (Gamit ang VisitStatus.PENDING o COMPLETED batay sa daloy)
      prisma.clinicVisit.findMany({
        where: {
          status: 'PENDING',
          patient: studentsWhere
        },
        orderBy: { visitDate: 'desc' },
        select: {
          id: true,
          visitDate: true,
          status: true,
          patient: {
            select: {
              id: true,
              idNumber: true,
              firstName: true,
              lastName: true,
              gradeLevel: true,
              section: true,
            }
          }
        }
      }),

      // 4. Pending Referrals na ginawa ng Head Teacher
      prisma.referral.findMany({
        where: {
          referredBy: teacherId,
          status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reason: true,
          urgency: true,
          status: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              idNumber: true,
              firstName: true,
              lastName: true,
              gradeLevel: true,
              section: true,
            }
          }
        }
      }),

      // 5. Recent Referrals
      prisma.referral.findMany({
        where: { referredBy: teacherId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reason: true,
          urgency: true,
          status: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              idNumber: true,
              firstName: true,
              lastName: true,
              gradeLevel: true,
              section: true,
            }
          }
        }
      }),

      // 6. Clinic Requests para sa mga estudyante ng section na ito
      prisma.clinicRequest.findMany({
        where: { patient: studentsWhere },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reason: true,
          status: true,
          requestDate: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              idNumber: true,
              firstName: true,
              lastName: true,
              gradeLevel: true,
              section: true,
            }
          }
        }
      }),

      // 7. Announcements (Batay sa Announcement model na may targetRole)
      // UPDATED PARA BASAHIN ANG TEACHERS & STAFF AT ALL STUDENTS & STAFF
      prisma.announcement.findMany({
        where: {
          OR: [
            { targetRole: 'ALL' },
            { targetRole: 'HEAD_TEACHER' },
            { targetRole: 'All Students & Staff' },
            { targetRole: 'Teachers & Staff' },
            { targetRole: null }
          ]
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),

      // 8. Audit logs ng gurong ito para sa Recent Activity
      prisma.auditLog.findMany({
        where: { userId: teacherId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
        }
      }).catch(() => [])
    ]);

    const activeRequestsCount = clinicRequests.filter((r: any) => r.status === 'PENDING' || r.status === 'APPROVED').length;

    res.json({
      teacherName: `${firstName} ${lastName}`,
      section: (handledGrade && handledSection) ? `${handledGrade} - ${handledSection}` : 'Unassigned',
      stats: {
        totalAssigned: totalAssignedCount,
        pendingReferrals: pendingReferrals.length,
        activeRequests: activeRequestsCount,
        inClinic: inClinicVisits.length
      },
      inClinicStudents: inClinicVisits,
      myStudents,
      pendingReferrals,
      recentReferrals,
      clinicRequests,
      announcements: announcements.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.description, 
        category: a.category,
        createdAt: a.createdAt
      })),
      recentActivities: recentActivities.map((act: any) => ({
        id: act.id,
        description: act.details || act.action,
        createdAt: act.createdAt
      }))
    });

  } catch (error) {
    console.error('[BACKEND] Head Teacher Dashboard Query Error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
});

// 2. GET /api/head-teacher/students/search — Search Assigned Students
router.get('/students/search', requireHeadTeacher, async (req: any, res: any) => {
  try {
    const { query } = req.query;
    const { handledGrade, handledSection } = req.teacher;

    const students = await prisma.patient.findMany({
      where: {
        gradeLevel: handledGrade || undefined,
        section: handledSection || undefined,
        OR: query ? [
          { firstName: { contains: String(query), mode: 'insensitive' } },
          { lastName: { contains: String(query), mode: 'insensitive' } },
          { idNumber: { contains: String(query), mode: 'insensitive' } },
        ] : undefined
      },
      take: 20,
      orderBy: { lastName: 'asc' },
      select: {
        id: true,
        idNumber: true,
        firstName: true,
        lastName: true,
        gradeLevel: true,
        section: true,
        gender: true,
      }
    });

    res.json({ students });
  } catch (error) {
    console.error('[BACKEND] Student Search Error:', error);
    res.status(500).json({ error: 'Error searching assigned students' });
  }
});

// 3. POST /api/head-teacher/referrals — Gumawa ng Bagong Referral
router.post('/referrals', requireHeadTeacher, async (req: any, res: any) => {
  try {
    const { patientId, reason, urgency } = req.body;
    const { id: teacherId, handledGrade, handledSection } = req.teacher;

    if (!patientId || !reason) {
      return res.status(400).json({ error: 'Patient ID and referral reason are required.' });
    }

    const student = await prisma.patient.findFirst({
      where: {
        id: patientId,
        gradeLevel: handledGrade || undefined,
        section: handledSection || undefined
      }
    });

    if (!student) {
      return res.status(403).json({ error: 'Forbidden: You can only refer students assigned to your section.' });
    }

    const newReferral = await prisma.referral.create({
      data: {
        patientId,
        referredBy: teacherId,
        reason,
        urgency: urgency || 'MEDIUM',
        status: 'PENDING'
      },
      include: {
        patient: {
          select: { firstName: true, lastName: true, gradeLevel: true, section: true }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'SUBMIT_REFERRAL',
        module: 'REFERRALS',
        details: `Submitted clinic referral for student ${student.firstName} ${student.lastName}`,
        role: 'HEAD_TEACHER'
      }
    }).catch(() => {});

    res.status(201).json({ message: 'Referral submitted successfully', referral: newReferral });
  } catch (error) {
    console.error('[BACKEND] Create Referral Error:', error);
    res.status(500).json({ error: 'Failed to submit referral' });
  }
});

// 4. PATCH /api/head-teacher/referrals/:id/cancel — I-cancel ang Pending Referral
router.patch('/referrals/:id/cancel', requireHeadTeacher, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { id: teacherId } = req.teacher;

    const referral = await prisma.referral.findFirst({
      where: { id, referredBy: teacherId }
    });

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found or access denied.' });
    }

    if (referral.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending referrals can be cancelled.' });
    }

    const updated = await prisma.referral.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: 'Referral cancelled successfully', referral: updated });
  } catch (error) {
    console.error('[BACKEND] Cancel Referral Error:', error);
    res.status(500).json({ error: 'Failed to cancel referral' });
  }
});

// 5. GET /api/head-teacher/clinic-requests — Kunin lahat ng clinic requests ng section
router.get('/clinic-requests', requireHeadTeacher, async (req: any, res: any) => {
  try {
    const { handledGrade, handledSection } = req.teacher;

    const requests = await prisma.clinicRequest.findMany({
      where: {
        patient: {
          gradeLevel: handledGrade || undefined,
          section: handledSection || undefined
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reason: true,
        status: true,
        requestDate: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            idNumber: true,
            firstName: true,
            lastName: true,
            gradeLevel: true,
            section: true,
          }
        }
      }
    });

    res.json({ clinicRequests: requests });
  } catch (error) {
    console.error('[BACKEND] Clinic Requests Error:', error);
    res.status(500).json({ error: 'Failed to fetch clinic requests' });
  }
});

// 6. GET /api/head-teacher/announcements — Kunin lahat ng clinic announcements
router.get('/announcements', requireHeadTeacher, async (req: any, res: any) => {
  try {
    // UPDATED PARA BASAHIN ANG TEACHERS & STAFF AT ALL STUDENTS & STAFF
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetRole: 'ALL' },
          { targetRole: 'HEAD_TEACHER' },
          { targetRole: 'All Students & Staff' },
          { targetRole: 'Teachers & Staff' },
          { targetRole: null }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ announcements });
  } catch (error) {
    console.error('[BACKEND] Announcements Error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// 7. GET /api/head-teacher/notifications — Kunin ang mga notifications/recent activities
router.get('/notifications', requireHeadTeacher, async (req: any, res: any) => {
  try {
    const { id: teacherId } = req.teacher;

    const notifications = await prisma.auditLog.findMany({
      where: { userId: teacherId },
      orderBy: { createdAt: 'desc' },
      take: 20, 
      select: {
        id: true,
        action: true,
        module: true,
        details: true,
        createdAt: true,
      }
    });

    res.json({ notifications });
  } catch (error) {
    console.error('[BACKEND] Notifications Error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 8. GET /api/head-teacher/settings — Kunin ang Profile Details ng Guro
router.get('/settings', requireHeadTeacher, async (req: any, res: any) => {
  try {
    res.json({ profile: req.teacher });
  } catch (error) {
    console.error('[BACKEND] Settings Error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ==============================================================================
// 9. GET /api/head-teacher/students/:id — Kunin ang Profile at History ng Estudyante
// ==============================================================================
router.get('/students/:id', requireHeadTeacher, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { handledGrade, handledSection } = req.teacher;

    const student = await prisma.patient.findFirst({
      where: {
        id,
        // Security: Para sigurado na section lang niya ang pwede niyang buksan
        gradeLevel: handledGrade || undefined,
        section: handledSection || undefined,
      },
      include: {
        referrals: {
          orderBy: { createdAt: 'desc' } // Laging nauuna ang pinakabago
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found or not assigned to your section.' });
    }

    res.json({ student });
  } catch (error) {
    console.error('[BACKEND] Fetch Student Profile Error:', error);
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

export default router;