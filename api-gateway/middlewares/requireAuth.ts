import type { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'En-tête Authorization manquant ou invalide' });
    }

    try {
        const meRes = await axios.get(`${AUTH_SERVICE_URL}/users/me`, {
            headers: { Authorization: authHeader },
        });

        const user = meRes.data;
        if (!user || !user.id) {
            return res.status(500).json({ message: 'Réponse invalide du service d’authentification' });
        }

        (req as any).userId = user.id;
        req.headers['x-user-id'] = String(user.id);

        return next();
    } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
            return res.status(401).json({ message: 'Token invalide' });
        }

        console.error('Erreur auth-service :', err?.message ?? err);
        return res.status(502).json({ message: 'Service d’authentification indisponible' });
    }
}