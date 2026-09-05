import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';

// Import ang routes
import authRoutes from './routes/auth';
import headTeacherRoutes from './routes/headTeacher';
import nurseRoutes from './routes/nurse';
import studentRoutes from './routes/student'; 
import studentsRoutes from './routes/students';
import clinicVisitsRoutes from './routes/clinicVisits'; // 👈 1. IDINAGDAG ANG CLINIC VISITS ROUTER

// I-load ang .env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000', // Payagan ang Next.js frontend
  credentials: true
}));
app.use(express.json());

// Ilagay ang mga API Routes dito
app.use('/api/auth', authRoutes); // Tatawagin sa http://localhost:5000/api/auth/login
app.use('/api/head-teacher', headTeacherRoutes); // Para sa Head Teacher
app.use('/api/nurse', nurseRoutes); // Para sa Nurse
app.use('/api/student', studentRoutes); // Para sa Student Dashboard
app.use('/api/students', studentsRoutes); // Para sa Student Management Directory
app.use('/api/clinic-visits', clinicVisitsRoutes); // 👈 2. IDINAGDAG DITO PARA MABASA NG FRONTEND ANG API

// Test Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'School Clinic API is running! 🚀' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 Backend Server running on port ${PORT}`);
  console.log(`🔗 Test URL: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});