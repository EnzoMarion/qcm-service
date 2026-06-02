import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const authRouter = Router();

authRouter.post('/local/register', async (req, res) => {
    const { email, password } = req.body;

    const userWithEmail = await prisma.user.findFirst({ where: { email } });
    if (userWithEmail) {
        return res.status(400).json('email already exists');
    } else {
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS!));
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });
        return res.json(newUser);
    }
});

authRouter.post('/local', async (req, res) => {
    const { email, password } = req.body;

    const userWithEmail = await prisma.user.findFirst({ where: { email } });
    if (!userWithEmail) {
        return res.status(400).json('email or password is incorrect');
    } else {
        const isPasswordCorrect = await bcrypt.compare(password, userWithEmail.password);
        if (isPasswordCorrect) {
            const token = jwt.sign(userWithEmail, process.env.JWT_SECRET!);
            return res.json({
                token,
                ...userWithEmail,
            });
        } else {
            return res.status(400).json('email or password is incorrect');
        }
    }
});