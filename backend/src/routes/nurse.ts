import { Router } from 'express';
import prisma from '../lib/prisma'; 
import jwt from 'jsonwebtoken'; 
import { sendEmail, sendBatchEmails } from '../utils/mailer';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_clinic_key_2026';

// =====================================================================
// MIDDLEWARE: NURSE AUTHORIZATION & TOKEN VERIFICATION 🛡️
// =====================================================================
const requireNurse = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role && decoded.role !== 'NURSE') {
      return res.status(403).json({ error: 'Forbidden: Access restricted to Nurses only' });
    }
    
    req.user = decoded; 
    next();
  } catch (err: any) {
    console.error('[BACKEND] JWT Verification Error in Nurse Route:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(requireNurse);

// 1. ROUTE PARA SA STUDENTS DIRECTORY
router.get('/students', async (req: any, res: any): Promise<any> => {
  try {
    const students = await prisma.patient.findMany({ orderBy: { lastName: 'asc' } });
    return res.json({ students });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// 2. ROUTE PARA SA NURSE DASHBOARD 
router.get('/dashboard-stats', async (req: any, res: any): Promise<any> => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

    const totalPatientsToday = await prisma.clinicVisit.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } });
    const pendingClearances = await prisma.patient.count({ where: { clearanceStatus: 'PENDING CLEARANCE' } });
    const lowMedicineStock = await prisma.inventoryItem.count({ where: { quantity: { lte: 10 } } });

    return res.json({ totalPatientsToday, pendingClearances, lowMedicineStock });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// 3. ROUTE PARA MAG-ADD NG ESTUDYANTE
router.post('/students', async (req: any, res: any): Promise<any> => {
  try {
    const { idNumber, firstName, lastName, gender, dateOfBirth, contactNo, gradeLevel, section, clearanceStatus } = req.body;
    const existingPatient = await prisma.patient.findUnique({ where: { idNumber } });

    if (existingPatient) return res.status(400).json({ error: "A student with this ID Number already exists." });

    const newStudent = await prisma.patient.create({
      data: { idNumber, firstName, lastName, gender, dateOfBirth: new Date(dateOfBirth), contactNo, gradeLevel, section, clearanceStatus, type: 'STUDENT' }
    });
    return res.status(201).json({ message: "Student record added successfully!", student: newStudent });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save student record." });
  }
});

// 4. ROUTE PARA I-UPDATE ANG CLEARANCE STATUS
router.patch('/students/:id/status', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { clearanceStatus } = req.body;
    const updatedStudent = await prisma.patient.update({ where: { id }, data: { clearanceStatus } });
    return res.json({ message: "Status updated successfully", student: updatedStudent });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// 5. ROUTE: KUNIN ANG PROFILE NG ISANG ESTUDYANTE
router.get('/students/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const student = await prisma.patient.findUnique({
      where: { id },
      include: { visits: { orderBy: { createdAt: 'desc' } } }
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
    return res.json({ student });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch student profile" });
  }
});

// =====================================================================
// 5.5: UPDATE FULL PROFILE NG ESTUDYANTE 
// =====================================================================
router.put('/students/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, dateOfBirth, gender, contactNo, gradeLevel, section } = req.body;
    
    const updatedStudent = await prisma.patient.update({
      where: { id },
      data: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        contactNo,
        gradeLevel,
        section
      }
    });

    return res.json({ message: "Profile updated successfully", student: updatedStudent });
  } catch (error) {
    console.error('[BACKEND] Error updating student profile:', error);
    return res.status(500).json({ error: "Failed to update student profile." });
  }
});

// =====================================================================
// 6. ROUTE: MAG-LOG NG CLINIC VISIT
// =====================================================================
router.post('/students/:id/visits', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params; 
    const { reason, diagnosis, treatment, medicineUsed, status } = req.body;
    const newVisit = await prisma.clinicVisit.create({
      data: { 
        patientId: id, 
        reason, 
        diagnosis, 
        treatment, 
        medicineUsed, 
        status: status || 'WAITING' 
      }
    });
    return res.status(201).json({ message: "Visit logged successfully", visit: newVisit });
  } catch (error) {
    return res.status(500).json({ error: "Failed to log clinic visit." });
  }
});

// =====================================================================
// 7. ROUTE: CLINIC VISITS PAGE
// =====================================================================
router.get('/clinic-visits', async (req: any, res: any): Promise<any> => {
  try {
    const visits = await prisma.clinicVisit.findMany({
      include: { patient: { select: { firstName: true, lastName: true, idNumber: true } } },
      orderBy: { createdAt: 'desc' } 
    });

    const totalVisitsFound = await prisma.clinicVisit.count(); 
    
    const currentlyResting = await prisma.clinicVisit.count({ 
      where: { 
        status: { in: ['WAITING', 'IN_CONSULTATION', 'PENDING'] } 
      } 
    });

    return res.json({ visits, stats: { totalVisitsToday: totalVisitsFound, currentlyResting } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch clinic visits' });
  }
});

// 8. ROUTE: UPDATE STATUS NG CLINIC VISIT
router.patch('/clinic-visits/:id/status', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    const updatedVisit = await prisma.clinicVisit.update({ where: { id }, data: { status } });
    return res.json({ message: "Visit status updated successfully", visit: updatedVisit });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update visit status." });
  }
});

// =====================================================================
// 9. ROUTE PARA SA MEDICAL REFERRALS
// =====================================================================
router.get('/referrals', async (req: any, res: any): Promise<any> => {
  try {
    const referrals = await prisma.referral.findMany({
      include: {
        patient: { select: { firstName: true, lastName: true, idNumber: true } }
      },
      orderBy: { createdAt: 'desc' } 
    });
    return res.json({ referrals });
  } catch (error) {
    console.error('[BACKEND] Error fetching referrals:', error);
    return res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// =====================================================================
// 10. ROUTE PARA I-UPDATE ANG STATUS NG REFERRAL
// =====================================================================
router.patch('/referrals/:id/status', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const updatedReferral = await prisma.referral.update({ where: { id }, data: { status } });
    return res.json({ message: "Referral status updated", referral: updatedReferral });
  } catch (error) {
    console.error('[BACKEND] Error updating referral status:', error);
    return res.status(500).json({ error: "Failed to update referral status." });
  }
});

// =====================================================================
// 11. ROUTE PARA MAG-CREATE NG BAGONG REFERRAL
// =====================================================================
router.post('/referrals', async (req: any, res: any): Promise<any> => {
  try {
    const { patientId, referredTo, reason } = req.body;

    const newReferral = await prisma.referral.create({
      data: {
        patientId,
        referredTo, 
        reason,
        status: 'PENDING'
      },
      include: {
        patient: { select: { firstName: true, lastName: true, idNumber: true } }
      }
    });

    return res.status(201).json({ message: "Referral created successfully", referral: newReferral });
  } catch (error) {
    console.error('[BACKEND] Error creating referral:', error);
    return res.status(500).json({ error: "Failed to create referral." });
  }
});

// =====================================================================
// 12. ROUTE PARA KUNIN ANG HEALTH RECORDS (Listahan at Stats)
// =====================================================================
router.get('/health-records', async (req: any, res: any): Promise<any> => {
  try {
    const records = await prisma.healthRecord.findMany({
      include: {
        // 👇 ITO YUNG BINAGO PARA MAKUHA LAHAT NG DETALYE NG PATIENT 👇
        patient: true
      },
      orderBy: { updatedAt: 'desc' } 
    });

    const totalActive = await prisma.healthRecord.count();
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const updatedThisMonth = await prisma.healthRecord.count({
      where: { updatedAt: { gte: startOfMonth } }
    });

    return res.json({ records, stats: { totalActive, updatedThisMonth } });
  } catch (error) {
    console.error('[BACKEND] Error fetching health records:', error);
    return res.status(500).json({ error: 'Failed to fetch health records' });
  }
});

// =====================================================================
// 13. ROUTE PARA MAG-CREATE NG BAGONG HEALTH RECORD
// =====================================================================
router.post('/health-records', async (req: any, res: any): Promise<any> => {
  try {
    const { patientId, bloodType, allergies, conditionStatus, lastCheckup } = req.body;

    const existingRecord = await prisma.healthRecord.findUnique({
      where: { patientId }
    });

    if (existingRecord) {
      return res.status(400).json({ error: "This patient already has a health record." });
    }

    const newRecord = await prisma.healthRecord.create({
      data: {
        patientId,
        bloodType,
        allergies,
        conditionStatus: conditionStatus || "HEALTHY",
        lastCheckup: lastCheckup ? new Date(lastCheckup) : null
      },
      include: {
        patient: { select: { firstName: true, lastName: true, idNumber: true } }
      }
    });

    return res.status(201).json({ message: "Health record created successfully", record: newRecord });
  } catch (error) {
    console.error('[BACKEND] Error creating health record:', error);
    return res.status(500).json({ error: "Failed to create health record." });
  }
});

// =====================================================================
// 14. ROUTE PARA I-UPDATE ANG CONDITION STATUS NG HEALTH RECORD
// =====================================================================
router.patch('/health-records/:id/status', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { conditionStatus } = req.body; 

    const updatedRecord = await prisma.healthRecord.update({ 
      where: { id }, 
      data: { conditionStatus } 
    });

    return res.json({ message: "Condition status updated", record: updatedRecord });
  } catch (error) {
    console.error('[BACKEND] Error updating health record status:', error);
    return res.status(500).json({ error: "Failed to update condition status." });
  }
});

// =====================================================================
// 14.5 ROUTE PARA SA FULL UPDATE NG HEALTH RECORD (VITALS & EMERGENCY) ✨
// =====================================================================
router.put('/health-records/:id/full-update', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      bloodType,
      allergies,
      conditionStatus,
      weight,
      height,
      birthdate,
      gender,
      emergencyContactPerson,
      emergencyContactNumber,
      patientId
    } = req.body;

    // 1. I-update ang Health Record Table (Vitals at Medical Profile)
    const updatedRecord = await prisma.healthRecord.update({
      where: { id },
      data: {
        bloodType: bloodType || null,
        allergies: allergies || "None",
        conditionStatus: conditionStatus || "HEALTHY",
        weight: weight ? parseFloat(weight.toString()) : null,
        height: height ? parseFloat(height.toString()) : null,
      },
    });

    // 2. I-update ang Patient Table (Personal at Emergency Contact)
    if (patientId) {
      await prisma.patient.update({
        where: { id: patientId },
        data: {
          dateOfBirth: birthdate ? new Date(birthdate) : null,
          gender: gender || null,
          emergencyContactPerson: emergencyContactPerson || null,
          emergencyContactNumber: emergencyContactNumber || null,
        },
      });
    }

    return res.status(200).json({ 
      message: "Health record fully updated successfully", 
      record: updatedRecord 
    });

  } catch (error) {
    console.error("[BACKEND] Error updating full health record:", error);
    return res.status(500).json({ error: "Failed to update full health record." });
  }
});

// =====================================================================
// 15. ROUTE PARA SA MEDICAL HISTORY (KUNIN LAHAT)
// =====================================================================
router.get('/medical-history', async (req: any, res: any): Promise<any> => {
  try {
    const histories = await prisma.medicalHistory.findMany({
      include: {
        patient: { select: { firstName: true, lastName: true, idNumber: true } }
      },
      orderBy: { dateOrYear: 'desc' } 
    });
    return res.json({ histories });
  } catch (error) {
    console.error('[BACKEND] Error fetching medical history:', error);
    return res.status(500).json({ error: 'Failed to fetch medical history' });
  }
});

// =====================================================================
// 16. ROUTE PARA MAG-CREATE NG BAGONG MEDICAL HISTORY
// =====================================================================
router.post('/medical-history', async (req: any, res: any): Promise<any> => {
  try {
    const { patientId, condition, notes, dateOrYear, severity } = req.body;

    const newHistory = await prisma.medicalHistory.create({
      data: {
        patientId,
        condition,
        notes,
        dateOrYear: new Date(dateOrYear),
        severity: severity || "ONGOING"
      },
      include: {
        patient: { select: { firstName: true, lastName: true, idNumber: true } }
      }
    });

    return res.status(201).json({ message: "Medical history added successfully", history: newHistory });
  } catch (error) {
    console.error('[BACKEND] Error adding medical history:', error);
    return res.status(500).json({ error: "Failed to add medical history." });
  }
});

// =====================================================================
// 17. ROUTE PARA I-UPDATE ANG SEVERITY NG MEDICAL HISTORY
// =====================================================================
router.patch('/medical-history/:id/severity', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { severity } = req.body; 

    const updatedHistory = await prisma.medicalHistory.update({ 
      where: { id }, 
      data: { severity } 
    });

    return res.json({ message: "Severity updated", history: updatedHistory });
  } catch (error) {
    console.error('[BACKEND] Error updating medical history severity:', error);
    return res.status(500).json({ error: "Failed to update severity." });
  }
});

// =====================================================================
// 18. ROUTE PARA KUNIN ANG MEDICATIONS AT STATS
// =====================================================================
router.get('/inventory', async (req: any, res: any): Promise<any> => {
  try {
    const medications = await prisma.inventoryItem.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    const totalTypes = await prisma.inventoryItem.count();
    
    const lowStockCount = await prisma.inventoryItem.count({ 
      where: { quantity: { lte: 15 } } 
    });
    
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    const expiringSoonCount = await prisma.inventoryItem.count({
      where: { expiryDate: { lte: threeMonthsFromNow } } 
    });

    return res.json({ medications, stats: { totalTypes, lowStockCount, expiringSoonCount } });
  } catch (error) {
    console.error('[BACKEND] Error fetching inventory:', error);
    return res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// =====================================================================
// 19. ROUTE PARA MAG-ADD NG BAGONG MEDICATION
// =====================================================================
router.post('/inventory', async (req: any, res: any): Promise<any> => {
  try {
    const { name, category, quantity, unit, expiryDate } = req.body;
    const qty = parseInt(quantity);
    
    let autoStatus = qty <= 5 ? "CRITICAL STOCK" : qty <= 15 ? "LOW STOCK" : "IN STOCK";
    if (expiryDate) {
      const exp = new Date(expiryDate);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      if (exp <= new Date()) autoStatus = "EXPIRED";
      else if (exp <= threeMonthsFromNow) autoStatus = "EXPIRING SOON";
    }

    const newMed = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        quantity: qty,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: autoStatus
      }
    });
    return res.status(201).json({ message: "Medication added", medication: newMed });
  } catch (error) {
    console.error('[BACKEND] Error adding medication:', error);
    return res.status(500).json({ error: "Failed to add medication." });
  }
});

// =====================================================================
// 20. ROUTE PARA I-EDIT ANG MEDICATION
// =====================================================================
router.put('/inventory/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, category, quantity, unit, expiryDate } = req.body;
    const qty = parseInt(quantity);

    let autoStatus = qty <= 5 ? "CRITICAL STOCK" : qty <= 15 ? "LOW STOCK" : "IN STOCK";
    if (expiryDate) {
      const exp = new Date(expiryDate);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      if (exp <= new Date()) autoStatus = "EXPIRED";
      else if (exp <= threeMonthsFromNow) autoStatus = "EXPIRING SOON";
    }

    const updatedMed = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name, category, quantity: qty, unit, status: autoStatus,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    });
    return res.json({ message: "Medication updated", medication: updatedMed });
  } catch (error) {
    console.error('[BACKEND] Error updating medication:', error);
    return res.status(500).json({ error: "Failed to update medication." });
  }
});

// =====================================================================
// 21. ROUTE PARA I-DELETE ANG MEDICATION
// =====================================================================
router.delete('/inventory/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.inventoryItem.delete({ where: { id } });
    return res.json({ message: "Medication deleted successfully" });
  } catch (error) {
    console.error('[BACKEND] Error deleting medication:', error);
    return res.status(500).json({ error: "Failed to delete medication." });
  }
});

// =====================================================================
// 22. ROUTE PARA I-UPDATE ANG STATUS NG MEDICATION (3-DOTS MENU)
// =====================================================================
router.patch('/inventory/:id/status', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedMed = await prisma.inventoryItem.update({
      where: { id },
      data: { status }
    });
    return res.json({ message: "Status updated", medication: updatedMed });
  } catch (error) {
    console.error('[BACKEND] Error updating status:', error);
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// =====================================================================
// 23. ROUTE PARA KUNIN ANG MEDICAL SUPPLIES AT STATS (INVENTORY)
// =====================================================================
router.get('/medical-supplies', async (req: any, res: any): Promise<any> => {
  try {
    const supplies = await prisma.medicalSupply.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    const categories = new Set(supplies.map((s: any) => s.category));
    const totalCategories = categories.size;

    const lowStockCount = await prisma.medicalSupply.count({
      where: { status: 'LOW STOCK' } 
    });
    const criticalStockCount = await prisma.medicalSupply.count({
      where: { status: 'CRITICAL STOCK' } 
    });

    return res.json({ supplies, stats: { totalCategories, lowStockCount, criticalStockCount } });
  } catch (error) {
    console.error('[BACKEND] Error fetching medical supplies:', error);
    return res.status(500).json({ error: 'Failed to fetch medical supplies' });
  }
});

// =====================================================================
// 24. ROUTE PARA MAG-ADD NG BAGONG MEDICAL SUPPLY
// =====================================================================
router.post('/medical-supplies', async (req: any, res: any): Promise<any> => {
  try {
    const { name, category, quantity, unit, status } = req.body;
    const qty = parseInt(quantity);

    const newSupply = await prisma.medicalSupply.create({
      data: {
        name,
        category,
        quantity: qty,
        unit,
        status: status || "IN STOCK" 
      }
    });
    return res.status(201).json({ message: "Supply added successfully", supply: newSupply });
  } catch (error) {
    console.error('[BACKEND] Error adding supply:', error);
    return res.status(500).json({ error: "Failed to add medical supply." });
  }
});

// =====================================================================
// 25. ROUTE PARA I-EDIT ANG MEDICAL SUPPLY
// =====================================================================
router.put('/medical-supplies/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, category, quantity, unit, status } = req.body;
    const qty = parseInt(quantity);

    const updatedSupply = await prisma.medicalSupply.update({
      where: { id },
      data: { name, category, quantity: qty, unit, status } 
    });
    return res.json({ message: "Supply updated", supply: updatedSupply });
  } catch (error) {
    console.error('[BACKEND] Error updating supply:', error);
    return res.status(500).json({ error: "Failed to update supply." });
  }
});

// =====================================================================
// 26. ROUTE PARA I-DELETE ANG MEDICAL SUPPLY
// =====================================================================
router.delete('/medical-supplies/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.medicalSupply.delete({ where: { id } });
    return res.json({ message: "Supply deleted successfully" });
  } catch (error) {
    console.error('[BACKEND] Error deleting supply:', error);
    return res.status(500).json({ error: "Failed to delete supply." });
  }
});

// =====================================================================
// 27. ROUTE PARA I-UPDATE ANG STATUS NG MEDICAL SUPPLY (3-DOTS MENU)
// =====================================================================
router.patch('/medical-supplies/:id/status', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedSupply = await prisma.medicalSupply.update({
      where: { id },
      data: { status }
    });
    return res.json({ message: "Status updated", supply: updatedSupply });
  } catch (error) {
    console.error('[BACKEND] Error updating status:', error);
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// =====================================================================
// 28. ROUTE PARA KUNIN ANG EMERGENCY INCIDENTS AT STATS
// =====================================================================
router.get('/emergency-incidents', async (req: any, res: any): Promise<any> => {
  try {
    const incidents = await prisma.emergencyIncident.findMany({
      include: {
        patient: { select: { firstName: true, lastName: true, idNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const currentYear = new Date().getFullYear();
    const totalThisYear = incidents.filter((i: any) => new Date(i.createdAt).getFullYear() === currentYear).length;
    const hospitalTransfers = incidents.filter((i: any) => i.status === 'HOSPITAL TRANSFER').length;

    return res.json({ incidents, stats: { totalThisYear, hospitalTransfers } });
  } catch (error) {
    console.error('[BACKEND] Error fetching emergencies:', error);
    return res.status(500).json({ error: 'Failed to fetch emergency incidents' });
  }
});

// =====================================================================
// 29. ROUTE PARA MAG-LOG NG BAGONG EMERGENCY
// =====================================================================
router.post('/emergency-incidents', async (req: any, res: any): Promise<any> => {
  try {
    const { patientId, incidentType, description, location, status } = req.body;

    const newIncident = await prisma.emergencyIncident.create({
      data: {
        patientId: patientId || null,
        incidentType,
        description,
        location,
        status: status || "UNDER OBSERVATION"
      },
      include: {
        patient: { select: { firstName: true, lastName: true, idNumber: true } }
      }
    });

    return res.status(201).json({ message: "Emergency logged successfully", incident: newIncident });
  } catch (error) {
    console.error('[BACKEND] Error logging emergency:', error);
    return res.status(500).json({ error: "Failed to log emergency." });
  }
});

// =====================================================================
// 30. ROUTE PARA I-UPDATE ANG STATUS NG EMERGENCY (3-DOTS)
// =====================================================================
router.patch('/emergency-incidents/:id/status', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedIncident = await prisma.emergencyIncident.update({
      where: { id },
      data: { status }
    });

    return res.json({ message: "Emergency status updated", incident: updatedIncident });
  } catch (error) {
    console.error('[BACKEND] Error updating emergency status:', error);
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// =====================================================================
// 31. ROUTE PARA KUNIN ANG REPORTS
// =====================================================================
router.get('/reports', async (req: any, res: any): Promise<any> => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ reports });
  } catch (error) {
    console.error('[BACKEND] Error fetching reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// =====================================================================
// 32. ROUTE PARA MAG-GENERATE NG BAGONG REPORT
// =====================================================================
router.post('/reports', async (req: any, res: any): Promise<any> => {
  try {
    const { name, type, generatedBy } = req.body;

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reportId = `RPT-${year}-${month}-${randomStr}`;

    const newReport = await prisma.report.create({
      data: {
        reportId,
        name,
        type,
        generatedBy: generatedBy || "Nurse Joy Santos",
        status: "READY"
      }
    });

    return res.status(201).json({ message: "Report generated successfully", report: newReport });
  } catch (error) {
    console.error('[BACKEND] Error generating report:', error);
    return res.status(500).json({ error: "Failed to generate report." });
  }
});

// =====================================================================
// 33. ROUTE PARA I-UPDATE ANG STATUS NG REPORT (Archive)
// =====================================================================
router.patch('/reports/:id/status', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { status }
    });
    return res.json({ message: "Report status updated", report: updatedReport });
  } catch (error) {
    console.error('[BACKEND] Error updating report status:', error);
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// =====================================================================
// 34. ROUTE PARA I-DELETE ANG REPORT
// =====================================================================
router.delete('/reports/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.report.delete({ where: { id } });
    return res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error('[BACKEND] Error deleting report:', error);
    return res.status(500).json({ error: "Failed to delete report." });
  }
});

// =====================================================================
// 35. ROUTE PARA SA ANALYTICS PAGE
// =====================================================================
router.get('/analytics', async (req: any, res: any): Promise<any> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const visits = await prisma.clinicVisit.findMany({
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } 
    });

    const totalPatients = visits.length;

    const diagnosisCounts: Record<string, number> = {};
    visits.forEach((v: any) => {
      if (v.diagnosis && v.diagnosis.trim() !== '') {
        const diag = v.diagnosis.trim();
        diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1;
      }
    });

    const sortedDiagnoses = Object.entries(diagnosisCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const commonDiagnosis = sortedDiagnoses.length > 0 ? sortedDiagnoses[0].name : "N/A";
    const totalDiagnoses = sortedDiagnoses.reduce((acc, curr) => acc + curr.count, 0);
    const colors = ["bg-rose-500", "bg-blue-500", "bg-amber-500", "bg-teal-500", "bg-slate-400"];

    const topIllnesses = sortedDiagnoses.slice(0, 5).map((d, index) => ({
      name: d.name,
      count: d.count,
      percentage: totalDiagnoses > 0 ? Math.round((d.count / totalDiagnoses) * 100) : 0,
      color: colors[index % colors.length]
    }));

    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; 
    visits.forEach((v: any) => {
      dayCounts[new Date(v.createdAt).getDay()]++;
    });
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const maxDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const busiestDay = Math.max(...dayCounts) > 0 ? daysOfWeek[maxDayIndex] : "N/A";

    const daysInMonth = endOfMonth.getDate();
    const visitsOverTime = Array(daysInMonth).fill(0);
    visits.forEach((v: any) => {
      const day = new Date(v.createdAt).getDate();
      visitsOverTime[day - 1]++;
    });

    const maxVisitsInADay = Math.max(...visitsOverTime, 1);
    const chartData = visitsOverTime.map(count => Math.round((count / maxVisitsInADay) * 100)); 

    return res.json({
      totalPatients,
      commonDiagnosis,
      busiestDay,
      topIllnesses,
      chartData
    });

  } catch (error) {
    console.error('[BACKEND] Error fetching analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// =====================================================================
// 36. ROUTE PARA KUNIN ANG ANNOUNCEMENTS AT STATS
// =====================================================================
router.get('/announcements', async (req: any, res: any): Promise<any> => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const activeCount = announcements.filter((a: any) => a.status === 'ACTIVE').length;
    const totalViews = announcements.reduce((sum: number, a: any) => sum + a.views, 0);

    return res.json({ announcements, stats: { activeCount, totalViews } });
  } catch (error) {
    console.error('[BACKEND] Error fetching announcements:', error);
    return res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// =====================================================================
// 37. ROUTE PARA MAG-CREATE NG BAGONG ANNOUNCEMENT 📧 (WITH BATCH EMAIL)
// =====================================================================
router.post('/announcements', async (req: any, res: any): Promise<any> => {
  try {
    const { title, targetRole, description, status } = req.body;

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        targetRole: targetRole || "Everyone",
        description: description || "",
        status: status || "ACTIVE",
        views: 0
      }
    });

    // 👇 BATCH EMAIL SENDER LOGIC 👇
    try {
      let userQuery: any = { isActive: true }; 
      
      if (targetRole && targetRole !== "All Students & Staff") {
        const roleStr = targetRole.toUpperCase();
        if (roleStr.includes('STUDENT')) userQuery.role = 'STUDENT';
        else if (roleStr.includes('TEACHER')) userQuery.role = 'HEAD_TEACHER';
      }

      const targetUsers = await prisma.user.findMany({
        where: userQuery,
        select: { email: true, firstName: true }
      });

      const emailJobs = targetUsers.map((user: any) => {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <div style="background-color: #2563eb; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="margin: 0;">📢 Clinic Announcement</h2>
            </div>
            <div style="padding: 20px; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
              <h3 style="color: #1e40af; margin-top: 0;">${title}</h3>
              <p>Hello <b>${user.firstName}</b>,</p>
              <p style="white-space: pre-wrap;">${description}</p>
              <br/>
              <p style="margin-bottom: 0;">Stay healthy!</p>
              <p style="margin-top: 5px;"><b>- The School Clinic Team</b></p>
            </div>
          </div>
        `;
        
        return {
          from: 'School Clinic Portal <noreply@clinnovate.site>', 
          to: [user.email],
          subject: `📢 Clinic Announcement: ${title}`,
          html: htmlContent
        };
      });

      if (emailJobs.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < emailJobs.length; i += chunkSize) {
          const chunk = emailJobs.slice(i, i + chunkSize);
          sendBatchEmails(chunk);
        }
        console.log(`[BACKEND] Queued batch announcement emails for ${targetUsers.length} users.`);
      }

    } catch (emailError) {
      console.error("[BACKEND] Failed to send batch announcement emails:", emailError);
    }

    return res.status(201).json({ message: "Announcement created and emails sent!", announcement: newAnnouncement });
  } catch (error) {
    console.error('[BACKEND] Error creating announcement:', error);
    return res.status(500).json({ error: "Failed to create announcement." });
  }
});

// =====================================================================
// 38. ROUTE PARA I-EDIT ANG ANNOUNCEMENT
// =====================================================================
router.put('/announcements/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { title, targetRole, description, status } = req.body;

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: { title, targetRole, description, status }
    });

    return res.json({ message: "Announcement updated", announcement: updatedAnnouncement });
  } catch (error) {
    console.error('[BACKEND] Error updating announcement:', error);
    return res.status(500).json({ error: "Failed to update announcement." });
  }
});

// =====================================================================
// 39. ROUTE PARA I-UPDATE ANG STATUS NG ANNOUNCEMENT (3-DOTS)
// =====================================================================
router.patch('/announcements/:id/status', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: { status }
    });

    return res.json({ message: "Announcement status updated", announcement: updatedAnnouncement });
  } catch (error) {
    console.error('[BACKEND] Error updating status:', error);
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// =====================================================================
// 40. ROUTE PARA I-DELETE ANG ANNOUNCEMENT
// =====================================================================
router.delete('/announcements/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    return res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error('[BACKEND] Error deleting announcement:', error);
    return res.status(500).json({ error: "Failed to delete announcement." });
  }
});

// =====================================================================
// 41. ROUTE PARA KUNIN ANG AUDIT LOGS AT STATS
// =====================================================================
router.get('/audit-logs', async (req: any, res: any): Promise<any> => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logsToday = await prisma.auditLog.count({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } }
    });

    const securityAlerts = await prisma.auditLog.count({
      where: {
        OR: [
          { action: { contains: 'Delete' } },
          { action: { contains: 'Failed' } },
          { action: { contains: 'Unauthorized' } }
        ]
      }
    });

    return res.json({ logs, stats: { logsToday, securityAlerts } });
  } catch (error) {
    console.error('[BACKEND] Error fetching audit logs:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// =====================================================================
// 42. ROUTE PARA KUNIN ANG USER PROFILE
// =====================================================================
router.get('/profile', async (req: any, res: any): Promise<any> => {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'NURSE' } });

    if (!user) return res.status(404).json({ error: "User profile not found" });

    const { password, ...safeProfile } = user;
    return res.json({ profile: safeProfile });
  } catch (error) {
    console.error('[BACKEND] Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// =====================================================================
// 43. ROUTE PARA I-UPDATE ANG USER PROFILE
// =====================================================================
router.put('/profile', async (req: any, res: any): Promise<any> => {
  try {
    const { id, firstName, lastName, email } = req.body;
    
    if (!id) return res.status(400).json({ error: "User ID is required" });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, email }
    });

    const { password, ...safeProfile } = updatedUser;
    return res.json({ message: "Profile updated successfully", profile: safeProfile });
  } catch (error) {
    console.error('[BACKEND] Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// =====================================================================
// 44. ROUTE PARA MAG-PALIT NG PASSWORD
// =====================================================================
router.put('/change-password', async (req: any, res: any): Promise<any> => {
  try {
    const { id, newPassword } = req.body;
    
    if (!id || !newPassword) return res.status(400).json({ error: "Missing required fields" });

    await prisma.user.update({
      where: { id },
      data: { password: newPassword } 
    });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error('[BACKEND] Error updating password:', error);
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

// =====================================================================
// 45. ROUTE PARA KUNIN ANG MGA CLINIC REQUESTS / MEDICAL CLEARANCES
// =====================================================================
router.get('/clinic-requests', async (req: any, res: any): Promise<any> => {
  try {
    const requests = await prisma.clinicRequest.findMany({
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, idNumber: true, gradeLevel: true, section: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ clinicRequests: requests });
  } catch (error) {
    console.error('[BACKEND] Error fetching clinic requests:', error);
    return res.status(500).json({ error: 'Failed to fetch clinic requests' });
  }
});

// =====================================================================
// 46. ROUTE PARA MAG-ISSUE NG BAGONG CLINIC REQUEST / CLEARANCE
// =====================================================================
router.post('/clinic-requests', async (req: any, res: any): Promise<any> => {
  try {
    const { patientId, reason, status } = req.body;
    
    if (!patientId || !reason) {
      return res.status(400).json({ error: 'Patient ID and reason are required' });
    }

    const newRequest = await prisma.clinicRequest.create({
      data: {
        patientId,
        reason,
        status: status || 'APPROVED', 
        requestDate: new Date(),
      },
      include: { patient: true }
    });

    return res.status(201).json({ message: 'Clearance issued successfully', clinicRequest: newRequest });
  } catch (error) {
    console.error('[BACKEND] Error creating clinic request:', error);
    return res.status(500).json({ error: 'Failed to issue clearance' });
  }
});

// =====================================================================
// 47. ROUTE PARA KUNIN ANG MGA PATIENTS (PARA SA DROPDOWN SELECTION)
// =====================================================================
router.get('/patients', async (req: any, res: any): Promise<any> => {
  try {
    const patients = await prisma.patient.findMany({ orderBy: { lastName: 'asc' } });
    return res.json({ patients });
  } catch (error) {
    console.error('[BACKEND] Error fetching patients:', error);
    return res.status(500).json({ error: 'Failed to fetch patients' });
  }
});


// =====================================================================
// 48. ROUTE PARA KUNIN ANG MGA PENDING PROFILE REQUESTS
// =====================================================================
router.get('/profile-requests', async (req: any, res: any): Promise<any> => {
  try {
    const requests = await prisma.profileUpdateRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, schoolId: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    return res.json({ requests });
  } catch (error) {
    console.error('[BACKEND] Fetch Pending Requests Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve pending profile requests.' });
  }
});

// =====================================================================
// 49. ROUTE PARA I-APPROVE / I-REJECT ANG PROFILE REQUEST 📧 (WITH EMAIL)
// =====================================================================
router.put('/profile-requests/:id', async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    
    const reviewedById = req.user?.id || null; 

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED.' });
    }

    const request = await prisma.profileUpdateRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'This request has already been processed.' });

    // 👇 KUNG REJECTED 👇
    if (status === 'REJECTED') {
      await prisma.profileUpdateRequest.update({
        where: { id },
        data: { status: 'REJECTED', reviewedById, reviewedAt: new Date() }
      });
      
      sendEmail(
        request.user.email,
        "❌ Profile Update Request Status",
        `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #e11d48;">Request Rejected</h2>
          <p>Hello ${request.user.firstName},</p>
          <p>We're sorry, but your recent request to update your clinic profile has been <b>rejected</b> by the clinic administrator.</p>
          <p>Please visit the clinic in person if you need to make changes to your medical records.</p>
        </div>`
      ).catch((e: any) => console.error(e));

      return res.json({ message: 'Request rejected successfully.' });
    }

    // 👇 KUNG APPROVED 👇
    const updatedSchoolId = request.requestedSchoolId || request.user.schoolId;

    if (request.requestedSchoolId && request.requestedSchoolId !== request.user.schoolId) {
      const existingUserWithNewId = await prisma.user.findFirst({
        where: { schoolId: updatedSchoolId, id: { not: request.userId } }
      });

      if (existingUserWithNewId) {
        return res.status(400).json({ error: "The requested School ID is already being used by another account." });
      }
    }

    await prisma.$transaction(async (prismaTx) => {
      // 1. I-update ang request status
      await prismaTx.profileUpdateRequest.update({
        where: { id },
        data: { status: 'APPROVED', reviewedById, reviewedAt: new Date() }
      });
      
      // 2. I-update ang User table
      await prismaTx.user.update({
        where: { id: request.userId },
        data: {
          firstName: request.requestedFirstName || request.user.firstName,
          lastName: request.requestedLastName || request.user.lastName,
          schoolId: updatedSchoolId
        }
      });

      // 3. I-check kung may nag-e-exist na bang record sa Patient gamit ang BAGONG ID
      const targetPatient = await prismaTx.patient.findFirst({
        where: { idNumber: updatedSchoolId }
      });

      // 4. Hanapin ang LUMANG record (yung temporary account mula sa Google)
      const currentPatient = await prismaTx.patient.findFirst({ 
        where: { idNumber: request.user.schoolId } 
      });

      if (targetPatient) {
        // SCENARIO A: May existing Patient record na yung bagong ID
        await prismaTx.patient.update({
          where: { id: targetPatient.id },
          data: {
            firstName: request.requestedFirstName || targetPatient.firstName || "",
            lastName: request.requestedLastName || targetPatient.lastName || "",
            gradeLevel: request.requestedGradeLevel || targetPatient.gradeLevel,
            section: request.requestedSection || targetPatient.section
          }
        });
      } else if (currentPatient) {
        // SCENARIO B: Walang kaparehas na Patient record ang bagong ID
        await prismaTx.patient.update({
          where: { id: currentPatient.id },
          data: {
            idNumber: updatedSchoolId, 
            firstName: request.requestedFirstName || currentPatient.firstName || "",
            lastName: request.requestedLastName || currentPatient.lastName || "",
            gradeLevel: request.requestedGradeLevel || currentPatient.gradeLevel,
            section: request.requestedSection || currentPatient.section
          }
        });
      } else {
        // SCENARIO C: Walang Patient record at all, kaya gagawa tayo ng bago
        await prismaTx.patient.create({
          data: {
            idNumber: updatedSchoolId,
            type: 'STUDENT',
            firstName: request.requestedFirstName || request.user.firstName || "",
            lastName: request.requestedLastName || request.user.lastName || "",
            gradeLevel: request.requestedGradeLevel || "TBD",
            section: request.requestedSection || "TBD",
            gender: "NOT SPECIFIED",
            clearanceStatus: "CLEARED"
          }
        });
      }
    });

    sendEmail(
      request.user.email,
      "✅ Profile Update Request Approved",
      `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #16a34a;">Request Approved!</h2>
        <p>Hello ${request.requestedFirstName || request.user.firstName},</p>
        <p>Your request to update your clinic profile has been <b>approved</b>.</p>
        <p>Your records and dashboard have been updated accordingly. Thank you for keeping your medical information up to date!</p>
      </div>`
    ).catch((e: any) => console.error(e));

    return res.json({ message: 'Profile update request approved and records updated successfully.' });

  } catch (error: any) {
    console.error('[BACKEND] Handle Profile Request Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process profile request.' });
  }
});

export default router;