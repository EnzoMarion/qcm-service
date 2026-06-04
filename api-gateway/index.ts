import express from 'express';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { requireAuth } from './middlewares/requireAuth';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const QCM_SERVICE_URL = process.env.QCM_SERVICE_URL || 'http://localhost:3001';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';

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

const authProxyAuth = createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/auth${path}`,
});

const authProxyUsers = createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/users${path}`,
});

app.get('/api/qcms', qcmProxy);
app.get('/api/qcms/:id', qcmProxy);
app.get('/api/qcms/:id/question', qcmProxy);
app.get('/api/qcms/:id/result', qcmProxy);

app.post('/api/qcms', requireAuth, qcmProxy);
app.delete('/api/qcms/:id', requireAuth, qcmProxy);
app.post('/api/qcms/:id/response', requireAuth, qcmProxy);

app.use('/api/auth', authProxyAuth);
app.use('/api/users', authProxyUsers);

app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});