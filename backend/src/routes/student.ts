import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
// 👇 IN-IMPORT NATIN ANG MAILER PARA SA EMAIL NOTIF 👇
import { sendEmail } from '../utils/mailer';

const router = Router();
// TUGMANG-TUGMA NA ITO NGAYON SA AUTH.TS MO:
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_clinic_key_2026'; // LOWERCASE CHECK

// =====================================================================
// MIDDLEWARE: STRICT STUDENT AUTHORIZATION & IDOR PROTECTION
// =====================================================================
const requireStudent = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // I-check kung may role sa token.
    if (decoded.role && decoded.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Forbidden: Access restricted to Students only' });
    }
    
    // Fetch the User record
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Account inactive or not found' });
    }

    // Siguraduhing STUDENT talaga ang role sa database (pang-double check)
    if (user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Forbidden: You are not registered as a student' });
    }

    // STRICT IDOR PROTECTION: Hanapin ang Patient record gamit ang schoolId ng User
    let patient = await prisma.patient.findUnique({
      where: { idNumber: user.schoolId } 
    });

    // 🌟 SELF-HEALING LOGIC: Kung walang patient record ang User na ito, gawan agad! 🌟
    if (!patient) {
      console.log(`[BACKEND] 🆕 Auto-creating missing medical profile for ${user.email || user.firstName}`);
      
      patient = await prisma.patient.create({
        data: {
          idNumber: user.schoolId,
          // 👇 FIX: Nilagyan natin ng fallback para sa null values mula sa Google Login
          firstName: user.firstName || "Unknown",
          lastName: user.lastName || "Unknown",
          dateOfBirth: new Date('2000-01-01'), // Dummy fallback
          gender: 'OTHER', // Dummy fallback
          gradeLevel: 'TBD',
          section: 'TBD',
          contactNo: 'N/A',
          type: 'STUDENT'
        }
      });
    }

    // Attach BOTH user and patient context to the request.
    req.user = user;
    req.patient = patient;
    next();
  } catch (err: any) {
    console.error('[BACKEND] JWT Verification Error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired session token: ' + err.message });
  }
};

// =====================================================================
// GET: STUDENT DASHBOARD SUMMARY
// =====================================================================
router.get('/dashboard', requireStudent, async (req: any, res: any) => {
  try {
    // 100% IDOR-Safe: We only use the authenticated patient's ID.
    const patientId = req.patient.id;

    const [
      healthRecord,
      activeRequest,
      recentVisits,
      announcements,
      notifications
    ] = await Promise.all([
      prisma.healthRecord.findUnique({
        where: { patientId },
        select: { bloodType: true, allergies: true, conditionStatus: true }
      }),
      prisma.clinicRequest.findFirst({
        where: { patientId, status: { in: ['PENDING', 'APPROVED'] } },
        orderBy: { requestDate: 'desc' },
        select: { id: true, reason: true, status: true, requestDate: true }
      }),
      prisma.clinicVisit.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' }, // Changed visitDate to createdAt base sa schema natin
        take: 3,
        select: { id: true, createdAt: true, reason: true, status: true, diagnosis: true }
      }),
      prisma.announcement.findMany({
        where: {
          OR: [
            { targetRole: 'ALL' },
            { targetRole: 'STUDENT' },
            { targetRole: 'All Students & Staff' },
            { targetRole: 'Students Only' }
          ],
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      }).catch(() => []), 
      prisma.auditLog.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: { id: true, action: true, details: true, createdAt: true }
      }).catch(() => [])
    ]);

    res.json({
      student: {
        idNumber: req.patient.idNumber,
        firstName: req.patient.firstName,
        lastName: req.patient.lastName,
        gradeLevel: req.patient.gradeLevel,
        section: req.patient.section,
        clearanceStatus: req.patient.clearanceStatus,
      },
      healthSummary: healthRecord || { bloodType: 'Not Specified', allergies: 'None Recorded', conditionStatus: 'HEALTHY' },
      activeRequest: activeRequest || null,
      recentVisits: recentVisits.map((v: any) => ({ ...v, visitDate: v.createdAt })), // Fallback for UI
      announcements,
      notifications
    });

  } catch (error) {
    console.error('[BACKEND] Student Dashboard Query Error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
});

// =====================================================================
// GET: FULL HEALTH RECORD (/api/student/health)
// =====================================================================
router.get('/health', requireStudent, async (req: any, res: any) => {
  try {
    const patientId = req.patient.id;
    const healthRecord = await prisma.healthRecord.findUnique({ where: { patientId } });

    res.json({
      patient: {
        firstName: req.patient.firstName,
        lastName: req.patient.lastName,
        idNumber: req.patient.idNumber,
        dateOfBirth: req.patient.dateOfBirth,
        gender: req.patient.gender,
        // 👇 INAYOS NA FIELD NAMES 👇
        emergencyContactPerson: req.patient.emergencyContactPerson,
        emergencyContactNumber: req.patient.emergencyContactNumber,
      },
      healthRecord: healthRecord || {
        bloodType: 'Not Specified',
        allergies: 'None Recorded',
        medicalConditions: 'None Recorded',
        height: 0,
        weight: 0,
        conditionStatus: 'HEALTHY'
      }
    });
  } catch (error) {
    console.error('[BACKEND] Health Record Query Error:', error);
    res.status(500).json({ error: 'Failed to retrieve health record' });
  }
});

// =====================================================================
// GET: CLINIC VISITS HISTORY (/api/student/clinic-visits)
// =====================================================================
router.get('/clinic-visits', requireStudent, async (req: any, res: any) => {
  try {
    const patientId = req.patient.id;
    const visits = await prisma.clinicVisit.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ visits });
  } catch (error) {
    console.error('[BACKEND] Clinic Visits Query Error:', error);
    res.status(500).json({ error: 'Failed to retrieve clinic visit history' });
  }
});

// =====================================================================
// GET: APPOINTMENTS & REQUESTS (/api/student/appointments)
// =====================================================================
router.get('/appointments', requireStudent, async (req: any, res: any) => {
  try {
    const patientId = req.patient.id;
    const appointments = await prisma.clinicRequest.findMany({
      where: { patientId },
      orderBy: { requestDate: 'desc' }
    });
    res.json({ appointments });
  } catch (error) {
    console.error('[BACKEND] Appointments Query Error:', error);
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
});

// =====================================================================
// POST: SUBMIT CLINIC REQUEST (/api/student/request-visit)
// =====================================================================
router.post('/request-visit', requireStudent, async (req: any, res: any) => {
  try {
    const { reason, requestDate } = req.body;
    const patientId = req.patient.id;

    if (!reason) return res.status(400).json({ error: 'Reason for visit is required' });

    const newRequest = await prisma.clinicRequest.create({
      data: {
        patientId,
        reason,
        requestDate: requestDate ? new Date(requestDate) : new Date(),
        status: 'PENDING'
      }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'REQUEST_VISIT', details: `Student requested a visit for: ${reason}` }
    }).catch((e: any) => console.error('AuditLog Error:', e));

    res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
  } catch (error) {
    console.error('[BACKEND] Submit Request Error:', error);
    res.status(500).json({ error: 'Failed to submit clinic request' });
  }
});

// =====================================================================
// GET: CLINIC ANNOUNCEMENTS (/api/student/announcements)
// =====================================================================
router.get('/announcements', requireStudent, async (req: any, res: any) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetRole: 'ALL' },
          { targetRole: 'STUDENT' },
          { targetRole: 'All Students & Staff' },
          { targetRole: 'Students Only' }
        ],
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ announcements });
  } catch (error) {
    console.error('[BACKEND] Announcements Query Error:', error);
    res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
});

// =====================================================================
// GET: USER NOTIFICATIONS (/api/student/notifications)
// =====================================================================
router.get('/notifications', requireStudent, async (req: any, res: any) => {
  try {
    const notifications = await prisma.auditLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ notifications });
  } catch (error) {
    console.error('[BACKEND] Notifications Query Error:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// =====================================================================
// PUT: UPDATE PASSWORD (/api/student/settings/password)
// =====================================================================
router.put('/settings/password', requireStudent, async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Your account uses Google Login. You cannot change your password here.' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword } 
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_PASSWORD',
        details: 'Student successfully updated their account password.'
      }
    }).catch((e: any) => console.error('AuditLog Error:', e));

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('[BACKEND] Password Update Error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// =====================================================================
// POST: SUBMIT PROFILE UPDATE REQUEST 📧 (WITH EMAIL CONFIRMATION)
// =====================================================================
router.post('/profile-request', requireStudent, async (req: any, res: any) => {
  try {
    const { requestedFirstName, requestedLastName, requestedSchoolId, requestedGradeLevel, requestedSection, reason } = req.body;

    const existingRequest = await prisma.profileUpdateRequest.findFirst({
      where: { userId: req.user.id, status: 'PENDING' }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending profile update request. Please wait for the clinic to process it.' });
    }

    const newRequest = await prisma.profileUpdateRequest.create({
      data: {
        userId: req.user.id,
        requestedFirstName,
        requestedLastName,
        requestedSchoolId,
        requestedGradeLevel,
        requestedSection,
        reason
      }
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'PROFILE_UPDATE_REQUEST', details: `Student requested a profile data update.` }
    }).catch((e: any) => console.error('AuditLog Error:', e));

    // 👇 FIX: Nilagyan ng fallback 'Student' kung sakaling null ang name galing Google
    const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    sendEmail(
      req.user.email,
      "📝 Profile Update Request Received",
      `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2563eb;">Request Submitted Successfully!</h2>
        <p>Hello <b>${req.user.firstName || 'Student'}</b>,</p>
        <p>We have received your request to update your clinic profile on <b>${time}</b>.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #475569; font-size: 14px;"><b>Reason for update:</b> ${reason}</p>
        </div>
        <p>The clinic administrator will review this shortly. You will receive another email once your request is approved or rejected.</p>
        <br/>
        <p>Stay healthy!</p>
        <p><b>- The School Clinic Team</b></p>
      </div>`
    ).catch((e: any) => console.error("Email send failed:", e));

    res.status(201).json({ message: 'Profile update request submitted successfully.', request: newRequest });
  } catch (error) {
    console.error('[BACKEND] Profile Request Error:', error);
    res.status(500).json({ error: 'Failed to submit profile request.' });
  }
});

// =====================================================================
// GET: VIEW MY PROFILE REQUESTS (/api/student/profile-requests)
// =====================================================================
router.get('/profile-requests', requireStudent, async (req: any, res: any) => {
  try {
    const requests = await prisma.profileUpdateRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ requests });
  } catch (error) {
    console.error('[BACKEND] Fetch Profile Requests Error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile requests.' });
  }
});

// =====================================================================
// GET: VIEW MY PROFILE DETAILS (/api/student/profile) 
// =====================================================================
router.get('/profile', requireStudent, async (req: any, res: any) => {
  try {
    const profile = {
      // 👇 FIX: Nilagyan ng fallback para hindi mag-error kapag null
      firstName: req.user.firstName || "",
      lastName: req.user.lastName || "",
      email: req.user.email,
      role: req.user.role,
      schoolId: req.user.schoolId,
      gradeLevel: req.patient.gradeLevel, 
      section: req.patient.section,       
      isActive: req.user.isActive
    };
    res.json({ profile });
  } catch (error) {
    console.error('[BACKEND] Fetch Profile Error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

export default router;