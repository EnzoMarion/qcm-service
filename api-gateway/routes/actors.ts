import { Router } from 'express';
import { prisma } from '../prisma';

const actorsRouter = Router();

actorsRouter.get('/', async (_req, res) => {
    try {
        const filtersAny = _req.query.filters as any;
        const where: any = {};
        let nameContains: string | undefined = undefined;
        if (filtersAny && typeof filtersAny === 'object') {
            if (filtersAny.name && typeof filtersAny.name === 'object' && filtersAny.name.$contains) {
                nameContains = String(filtersAny.name.$contains);
            }
            if (!nameContains && filtersAny.name && typeof filtersAny.name === 'object' && filtersAny.name.$eq) {
                where.name = String(filtersAny.name.$eq);
            }
        }
        if (!nameContains && (_req.query['filters[name][$contains]'] as any)) {
            nameContains = String(_req.query['filters[name][$contains]']);
        }
        if (nameContains) {
            where.name = {
                contains: nameContains,
                mode: 'insensitive',
            };
        }
        const actors = await prisma.actor.findMany({ where });
        res.json(actors);
    } catch (error) {
        console.error(error);
    }
})

actorsRouter.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const actor = await prisma.actor.findUnique({ where: { id } });

        if (!actor) {
            return res.status(404).json({ error: 'Acteur non trouvé' });
        }

        res.json(actor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/*actorsRouter.get('/ajouter-film', async (req, res) => {
    const newfilm = await prisma.movie.create({
        data:{
            title:"toto",
            description:"toto",
            releaseDate:new Date(),
        }
    })
    res.json(newfilm)
})*/

export default actorsRouter;
