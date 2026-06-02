import 'dotenv/config';
import express from 'express';
import { prisma } from './prisma';
import moviesRouter from "./routes/movies";
import actorsRouter from "./routes/actors";
import {authRouter} from "./routes/auth";
import qcmsRouter from "./routes/qcm";
import {checkToken} from "./middlewares/checkToken";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get('/', (_req, res) => {
    res.json({ message: 'API Express + TypeScript OK' });
});

const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);
/*apiRouter.use('/api/movies', moviesRouter);
apiRouter.use('/api/actors', checkToken, actorsRouter);*/

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'qcm-service' });
});

app.use('/qcms', qcmsRouter);

app.use('/', apiRouter);

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});