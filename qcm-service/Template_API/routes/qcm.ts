import { Router } from 'express';
import { prisma } from '../prisma';

const qcmsRouter = Router();

qcmsRouter.get('/', async (_req, res) => {
    try {
        const qcms = await prisma.qcm.findMany({
            include: {
                question1: {
                    include: {
                        choices: true,
                        correctChoice: true,
                    },
                },
                question2: {
                    include: {
                        choices: true,
                        correctChoice: true,
                    },
                },
                question3: {
                    include: {
                        choices: true,
                        correctChoice: true,
                    },
                },
                question4: {
                    include: {
                        choices: true,
                        correctChoice: true,
                    },
                },
            },
        });

        res.json(qcms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});

qcmsRouter.post('/', async (req, res) => {
    try {
        const { title, questions } = req.body;

        if (!title || !Array.isArray(questions) || questions.length === 0) {
            res.status(400).json({ error: 'titre et questions requis' });
            return;
        }

        const questionIds: number[] = [];

        for (const q of questions) {
            const question = await prisma.question.create({
                data: {
                    text: q.text,
                },
            });

            const createdChoices = [];

            for (const choiceText of q.choices) {
                const choice = await prisma.choice.create({
                    data: {
                        text: choiceText,
                        questionId: question.id,
                    },
                });

                createdChoices.push(choice);
            }

            await prisma.question.update({
                where: { id: question.id },
                data: {
                    correctChoiceId: createdChoices[q.correctChoiceIndex].id,
                },
            });

            questionIds.push(question.id);
        }

        const qcms = await prisma.qcm.create({
            data: {
                title,
                qcmId1: questionIds[0] ?? null,
                qcmId2: questionIds[1] ?? null,
                qcmId3: questionIds[2] ?? null,
                qcmId4: questionIds[3] ?? null,
            },
        });

        res.json(qcms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});

qcmsRouter.get('/:id', async (req, res) => {
    try {
        const qcm = await prisma.qcm.findUnique({
            where: {id: Number(req.params.id)},
            include: {
                question1: {
                    include: {
                        choices: true,
                        correctChoice: true,
                    },
                },
                question2: {
                    include: {
                        choices: true,
                        correctChoice: true,
                    },
                },
                question3: {
                    include: {
                        choices: true,
                        correctChoice: true,
                    },
                },
                question4: {
                    include: {
                        choices: true,
                        correctChoice: true,
                    },
                },
            },
        });

        if (!qcm) {
            res.status(404).json({error: 'QCM non trouvé'});
            return;
        }

        res.json(qcm);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Erreur'});
    }
});

qcmsRouter.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const qcm = await prisma.qcm.findUnique({ where: { id } });
        if (!qcm) {
            res.status(404).json({ error: 'QCM non trouvé' });
            return;
        }

        await prisma.choice.deleteMany({
            where: {
                questionId: {
                    in: [qcm.qcmId1, qcm.qcmId2, qcm.qcmId3, qcm.qcmId4].filter(Boolean) as number[],
                },
            },
        });
        await prisma.question.deleteMany({
            where: {
                id: {
                    in: [qcm.qcmId1, qcm.qcmId2, qcm.qcmId3, qcm.qcmId4].filter(Boolean) as number[],
                },
            },
        });

        await prisma.qcm.delete({
            where: { id },
        });

        res.json({ message: 'QCM supprimé' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});

qcmsRouter.post('/:id/response', async (req, res) => {
    try {
        const qcmId = Number(req.params.id);
        const userId = Number(req.headers['x-user-id']);
        const questionId = Number(req.body.questionId);
        const choiceId = Number(req.body.choiceId);

        if (!userId) {
            res.status(401).json({ error: 'Utilisateur non authentifié' });
            return;
        }

        if (!questionId || !choiceId) {
            res.status(400).json({ error: 'questionId et choiceId requis' });
            return;
        }

        const qcm = await prisma.qcm.findUnique({
            where: { id: qcmId },
        });

        if (!qcm) {
            res.status(404).json({ error: 'QCM non trouvé' });
            return;
        }

        const questionIds = [qcm.qcmId1, qcm.qcmId2, qcm.qcmId3, qcm.qcmId4].filter(Boolean) as number[];

        if (!questionIds.includes(questionId)) {
            res.status(400).json({ error: 'Cette question ne fait pas partie du QCM' });
            return;
        }

        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            res.status(404).json({ error: 'Question non trouvée' });
            return;
        }

        const choice = await prisma.choice.findUnique({
            where: { id: choiceId },
        });

        if (!choice) {
            res.status(404).json({ error: 'Choix non trouvé' });
            return;
        }

        if (choice.questionId !== questionId) {
            res.status(400).json({ error: 'Ce choix ne correspond pas à cette question' });
            return;
        }

        const response = await prisma.userResponse.upsert({
            where: {
                userId_questionId: {
                    userId,
                    questionId,
                },
            },
            update: {
                choiceId,
            },
            create: {
                userId,
                questionId,
                choiceId,
            },
        });

        res.status(201).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});

qcmsRouter.get('/:id/question', async (req, res) => {
    try {
        const qcmId = Number(req.params.id);
        const userId = Number(req.headers['x-user-id']);

        if (!userId) {
            res.status(401).json({ error: 'Utilisateur non authentifié' });
            return;
        }

        const qcm = await prisma.qcm.findUnique({
            where: { id: qcmId },
            include: {
                question1: { include: { choices: true } },
                question2: { include: { choices: true } },
                question3: { include: { choices: true } },
                question4: { include: { choices: true } },
            },
        });

        if (!qcm) {
            res.status(404).json({ error: 'QCM non trouvé' });
            return;
        }

        const questions = [qcm.question1, qcm.question2, qcm.question3, qcm.question4].filter(Boolean);

        const responses = await prisma.userResponse.findMany({
            where: {
                userId,
                questionId: {
                    in: questions.map((q) => q!.id),
                },
            },
        });

        const answeredQuestionIds = responses.map((r) => r.questionId);
        const nextQuestion = questions.find((q) => !answeredQuestionIds.includes(q!.id));

        if (!nextQuestion) {
            res.json({ message: 'QCM terminé' });
            return;
        }

        res.json(nextQuestion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});

qcmsRouter.get('/:id/result', async (req, res) => {
    try {
        const qcmId = Number(req.params.id);
        const userId = Number(req.headers['x-user-id']);

        if (!userId) {
            res.status(401).json({ error: 'Utilisateur non authentifié' });
            return;
        }

        const qcm = await prisma.qcm.findUnique({
            where: { id: qcmId },
            include: {
                question1: true,
                question2: true,
                question3: true,
                question4: true,
            },
        });

        if (!qcm) {
            res.status(404).json({ error: 'QCM non trouvé' });
            return;
        }

        const questions = [qcm.question1, qcm.question2, qcm.question3, qcm.question4].filter(Boolean);
        const questionIds = questions.map((q) => q!.id);

        const responses = await prisma.userResponse.findMany({
            where: {
                userId,
                questionId: { in: questionIds },
            },
            include: {
                question: true,
            },
        });

        let score = 0;

        for (const response of responses) {
            if (response.choiceId === response.question.correctChoiceId) {
                score++;
            }
        }

        res.json({
            qcmId,
            userId,
            score,
            total: questionIds.length,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur' });
    }
});

export default qcmsRouter;