import express from 'express';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const QCM_SERVICE_URL = process.env.QCM_SERVICE_URL || 'http://localhost:3001';

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
});

app.use(
    '/api/qcms',
    createProxyMiddleware({
        target: QCM_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: (path) => `/qcms${path}`
    })
);

app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});