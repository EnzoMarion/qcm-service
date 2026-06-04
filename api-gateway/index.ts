import express from 'express';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const QCM_SERVICE_URL = process.env.QCM_SERVICE_URL || 'http://localhost:3001';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';

app.use(express.json());

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
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

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
});

const qcmProxy = createProxyMiddleware({
    target: QCM_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/qcms': '/qcms',
    },
});

const authProxy = createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/auth',
        '^/api/users': '/users',
    },
});

// QCM public
app.get('/api/qcms', qcmProxy);
app.get('/api/qcms/:id', qcmProxy);
app.get('/api/qcms/:id/question', qcmProxy);
app.get('/api/qcms/:id/result', qcmProxy);

// QCM protégé
app.post('/api/qcms', requireAuth, qcmProxy);
app.delete('/api/qcms/:id', requireAuth, qcmProxy);
app.post('/api/qcms/:id/response', requireAuth, qcmProxy);

// Auth public via gateway
app.use('/api/auth', authProxy);
app.use('/api/users', authProxy);

app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});