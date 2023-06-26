import swaggerUi from 'swagger-ui-express';
import specs from './swaggerOptions';
import express, { Request, Response } from 'express';
// import { MongoClient } from 'mongodb';
import { createTask, spawnWorkersHandler, killWorkersHandler } from './apiHandler';

const app = express();
app.use(express.json());

// const dbUri = 'mongodb://localhost:27017';
// const client = new MongoClient(dbUri);



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /spawn-workers:
 *   post:
 *     summary: Spawns W workers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               W:
 *                 type: number
 *     responses:
 *       200:
 *         description: The worker was successfully spawned
 */
app.post('/spawn-workers', (req: Request, res: Response) => {
    const { W } = req.body;

    if (typeof W !== 'number' || W < 1) {
        return res.status(400).json({ message: 'Invalid worker count. Must be a positive integer.' });
    }

    try {
        spawnWorkersHandler(W);
        res.status(201).json({ message: `Spawned ${W} workers` });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while spawning workers' });
    }
});

/**
 * @swagger
 * /kill-workers:
 *   delete:
 *     summary: delete all spawned workers
 *     responses:
 *       200:
 *         description: The worker was successfully spawned
 */
app.delete('/kill-workers', (req: Request, res: Response) => {
    try {
        const killedCount: number = killWorkersHandler();
        res.status(201).json({ message: `Killed ${killedCount} workers` });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while killing workers' });
    }
});


/**
 * @swagger
 * /create-task:
 *   post:
 *     summary: Creates a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               C:
 *                 type: number
 *               F:
 *                 type: number
 *     responses:
 *       201:
 *         description: The task was successfully created
 */
app.post('/create-task', async (req: Request, res: Response) => {
    const { C, F } = req.body;

    // Validation
    if (!Number.isInteger(C) || !Number.isInteger(F) || C <= 0 || F <= 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        await createTask(C, F);
        res.status(201).json({ message: 'The task was successfully created' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while creating the task' });
    }
});


const port = 3000;
app.listen(port, async () => {
    // await client.connect();
    console.log(`Server running on port ${port}`);
});


