"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const prisma_1 = require("./prisma");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 1995;
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.json({ message: 'API Express + TypeScript OK' });
});
// Movies
app.get('/api/movies', async (_req, res) => {
    try {
        const movies = await prisma_1.prisma.movie.findMany();
        res.json(movies);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});
app.get('/api/movies/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const movie = await prisma_1.prisma.movie.findUnique({ where: { id } });
        if (!movie) {
            return res.status(404).json({ error: 'Film non trouvé' });
        }
        res.json(movie);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});
// Actors
app.get('/api/actors', async (_req, res) => {
    try {
        const actors = await prisma_1.prisma.actor.findMany();
        res.json(actors);
    }
    catch (error) {
        console.error(error);
    }
});
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
