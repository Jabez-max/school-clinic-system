import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Ginagamit para i-encrypt ang password ng bagong user

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/users - Kukuha ng lahat ng users galing database
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        schoolId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc', // Mas mauuna sa listahan ang pinakabagong gumawa ng account
      }
    });

    res.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/admin/users - Gagawa ng bagong user galing sa Admin Modal
router.post('/users', async (req, res) => {
  try {
    const { email, password, firstName, lastName, schoolId, role } = req.body;

    // 1. I-check kung ginagamit na ang email na ito
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // 2. I-encrypt (hash) ang password bago i-save sa database para secure
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. I-save ang bagong user sa Prisma database
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        schoolId,
        role: role || 'STUDENT'
      }
    });

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /api/admin/users/:id/role - I-uupdate ang role ng user (Edit Role)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    });

    res.json({ message: "Role updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

// DELETE /api/admin/users/:id - Buburahin ang user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;