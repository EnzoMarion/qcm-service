import { Router } from 'express';
import { prisma } from '../prisma';

const moviesRouter = Router();
moviesRouter.get('/', async (_req, res) => {
    try {
        const where: any = {};
        const orderBy: any[] = [];
        let take: number | undefined;
        let skip: number | undefined;
        const filtersAny = _req.query.filters as any;
        let titleContains: string | undefined = undefined;
        if (filtersAny && typeof filtersAny === 'object') {
            if (filtersAny.title && typeof filtersAny.title === 'object' && filtersAny.title.$contains) {
                titleContains = String(filtersAny.title.$contains);
            }
            if (!titleContains && filtersAny.title && typeof filtersAny.title === 'object' && filtersAny.title.$eq) {
                where.title = String(filtersAny.title.$eq);
            }
        }
        if (!titleContains && (_req.query['filters[title][$contains]'] as any)) {
            titleContains = String(_req.query['filters[title][$contains]']);
        }
        if (titleContains) {
            where.title = {
                contains: titleContains,
                mode: 'insensitive',
            };
        }
        const sortAny = _req.query.sort as any;
        if (Array.isArray(sortAny)) {
            sortAny.forEach((s: string) => {
                const [field, direction] = s.split(':');
                orderBy.push({ [field]: direction === 'desc' ? 'desc' : 'asc' });
            });
        } else if (typeof sortAny === 'string') {
            const [field, direction] = sortAny.split(':');
            orderBy.push({ [field]: direction === 'desc' ? 'desc' : 'asc' });
        }
        const paginationAny = _req.query.pagination as any;
        if (paginationAny && paginationAny.limit) {
            take = Number(paginationAny.limit);
        }
        if (paginationAny && paginationAny.start) {
            skip = Number(paginationAny.start);
        }
        const movies = await prisma.movie.findMany({
            where,
            orderBy: orderBy.length > 0 ? orderBy : undefined,
            take,
            skip,
            // Populate
            /*include: {
                actors: true,
            },*/
        });
        res.json(movies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});

moviesRouter.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const movie = await prisma.movie.findUnique({ where: { id } });

        if (!movie) {
            return res.status(404).json({ error: 'Film non trouvé' });
        }

        res.json(movie);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});

export default moviesRouter;