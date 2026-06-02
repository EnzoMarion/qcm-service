import 'dotenv/config';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface DecodeToken {
    id: number;
    email: string;
    iat: number;
    exp: number;
}

export async function checkToken(req: Request, res: Response, next: NextFunction) {
    const fullToken = req.headers.authorization;

    if (!fullToken) {
        return res.status(401).send('No token provided');
    }

    const [typeToken, token] = fullToken.split(' ');
    if (typeToken !== 'Bearer') {
        return res.status(401).send('Invalid token type');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        console.log('decoded', decoded);
        if (decoded) {
            // @ts-ignore pour aller vite en TP
            req.token = token;
            next();
        } else {
            return res.status(401).send('Invalid token');
        }
    } catch (e) {
        console.log('invalid token on verify', e);
        return res.status(401).send('Invalid token on verify');
    }
}