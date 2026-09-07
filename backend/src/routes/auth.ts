import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { OAuth2Client } from 'google-auth-library'; 
// 👇 INAYOS ANG PATH: Kukunin na natin ito mula sa utils folder 👇
import { sendEmail } from '../utils/mailer';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_clinic_key_2026';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// =====================================================================
// 1. STANDARD LOGIN API (Email/School ID + Password)
// =====================================================================
router.post('/login', async (req: any, res: any): Promise<any> => {
  const identifier = req.body.email || req.body.schoolId;
  console.log(`\n[BACKEND] 🔎 May nag-ta-try mag-login: ${identifier}`);

  try {
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/School ID and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { schoolId: identifier }] }
    });

    if (!user) {
      await prisma.auditLog.create({
        data: { action: 'LOGIN_FAILED', details: `Failed login attempt for unknown account: ${identifier}` }
      }).catch((e: any) => console.error('AuditLog Error:', e));
      return res.status(401).json({ error: 'Invalid email/school ID or password' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'This account uses Google Login. Please click the "Sign in with Google" button.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await prisma.auditLog.create({
        data: { userId: user.id, action: 'LOGIN_FAILED', details: 'Invalid password provided' }
      }).catch((e: any) => console.error('AuditLog Error:', e));
      return res.status(401).json({ error: 'Invalid email/school ID or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, schoolId: user.schoolId, handledSection: user.handledSection, handledGrade: user.handledGrade },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log(`[BACKEND] ✅ SUCCESS (Standard)! Papapasukin na si: ${user.email} bilang ${user.role}`);

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN_SUCCESS', details: `Standard login as ${user.role}` }
    }).catch((e: any) => console.error('AuditLog Error:', e));

    // 📧 EMAIL NOTIF: STANDARD LOGIN DETECTED 📧
    const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    sendEmail(
      user.email,
      "🚨 Security Alert: New Login Detected",
      `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #1e40af;">New Login Detected</h2>
        <p>Hello <b>${user.firstName}</b>,</p>
        <p>A new login was detected on your School Clinic Portal account.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><b>Date & Time:</b> ${time}</p>
          <p style="margin: 5px 0;"><b>Method:</b> Email & Password</p>
        </div>
        <p>If this was you, you can safely ignore this email.</p>
      </div>`
    ).catch((e: any) => console.error(e));

    res.json({ message: 'Login successful', token, role: user.role, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// =====================================================================
// 2. REGISTER NEW STUDENT API 🚀 
// =====================================================================
router.post('/register', async (req: any, res: any): Promise<any> => {
  try {
    const { schoolId, firstName, lastName, email, password } = req.body;

    if (!schoolId || !firstName || !lastName || !email || !password) return res.status(400).json({ error: "All fields are required." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { schoolId }] }
    });

    if (existingUser) return res.status(400).json({ error: "Email or School ID is already registered." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.$transaction(async (prismaTx) => {
      await prismaTx.user.create({
        data: { schoolId, email, password: hashedPassword, firstName, lastName, role: 'STUDENT', isActive: true }
      });

      await prismaTx.patient.create({
        data: { idNumber: schoolId, type: 'STUDENT', firstName, lastName, gender: 'NOT SPECIFIED', dateOfBirth: null, contactNo: null, gradeLevel: 'TBD', section: 'TBD', clearanceStatus: 'CLEARED' }
      });
    });

    // 📧 EMAIL NOTIF: WELCOME TO THE SYSTEM 📧
    sendEmail(
      email,
      "🎉 Welcome to the School Clinic Portal!",
      `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2563eb;">Welcome, ${firstName}!</h2>
        <p>Your registration for the <b>School Clinic Portal</b> was successful.</p>
        <p>You can now use your School ID (<b>${schoolId}</b>) or this email address to log in.</p>
        <br/>
        <p>Stay healthy!</p>
        <p><b>- The School Clinic Team</b></p>
      </div>`
    ).catch((e: any) => console.error(e));

    return res.status(201).json({ message: "Registration successful! You can now log in." });

  } catch (error) {
    return res.status(500).json({ error: "Failed to register account. Please try again." });
  }
});

// =====================================================================
// 3. GOOGLE LOGIN API & AUTO-REGISTRATION
// =====================================================================
router.post('/google', async (req: any, res: any): Promise<any> => {
  const { credential } = req.body;
  console.log(`\n[BACKEND] 🔎 May nag-ta-try mag-login gamit ang Google...`);

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid Google Token' });

    const email = payload.email;
    const firstName = payload.given_name || 'Google';
    const lastName = payload.family_name || 'User';
    const googleId = payload.sub;

    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true; 
      const tempSchoolId = `G-${Math.floor(100000 + Math.random() * 900000)}`; 

      user = await prisma.user.create({
        data: { schoolId: tempSchoolId, email: email, firstName: firstName, lastName: lastName, role: 'STUDENT', isActive: true, googleId: googleId }
      });

      await prisma.patient.create({
        data: { idNumber: tempSchoolId, type: 'STUDENT', firstName: firstName, lastName: lastName, dateOfBirth: null, gender: 'NOT SPECIFIED', gradeLevel: 'TBD', section: 'TBD', contactNo: null }
      });

      await prisma.auditLog.create({
        data: { userId: user.id, action: 'GOOGLE_REGISTER_SUCCESS', details: `New user auto-registered via Google: ${email}` }
      }).catch((e: any) => console.error('AuditLog Error:', e));
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { email }, data: { googleId } });
    }

    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });

    const token = jwt.sign(
      { id: user.id, role: user.role, schoolId: user.schoolId, handledSection: user.handledSection, handledGrade: user.handledGrade },
      JWT_SECRET, { expiresIn: '1d' } 
    );

    const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    
    // 📧 EMAIL NOTIF: GOOGLE LOGIN OR AUTO-REGISTER 📧
    if (isNewUser) {
      sendEmail(
        email,
        "🎉 Welcome to the School Clinic Portal (Google)",
        `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome, ${firstName}!</h2>
          <p>Your Google account was successfully linked and registered.</p>
          <p>Your temporary Student ID is: <b>${user.schoolId}</b>. You can request a profile update in your dashboard to change this to your real ID.</p>
        </div>`
      ).catch((e: any) => console.error(e));
    } else {
      sendEmail(
        email,
        "🚨 Security Alert: Google Login Detected",
        `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #1e40af;">New Login Detected</h2>
          <p>Hello <b>${firstName}</b>,</p>
          <p>A login was detected using your <b>Google Account</b> on ${time}.</p>
          <p>If this was you, you can safely ignore this email.</p>
        </div>`
      ).catch((e: any) => console.error(e));
    }

    res.json({ message: 'Google login successful', token, role: user.role, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });

  } catch (error: any) {
    // 👇 IPINAPAKITA NA NGAYON ANG TOTOONG ERROR SA LOGS AT SA UI 👇
    console.error('\n[BACKEND] ❌ GOOGLE AUTH ERROR:', error);
    res.status(500).json({ error: `Google Auth Error: ${error.message}` });
  }
});

// =====================================================================
// 4. MIDDLEWARE: Taga-check ng Token
// =====================================================================
const verifyToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// =====================================================================
// 5. GET /ME API
// =====================================================================
router.get('/me', verifyToken, async (req: any, res: any): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, firstName: true, lastName: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;