import swaggerUi from 'swagger-ui-express';
import specs from './swaggerOptions';
import express, { Request, Response } from 'express';
// import { MongoClient } from 'mongodb';
import { createTask, spawnWorkersHandler, killWorkersHandler, updateSubtaskState, getAllTasks, getTask } from './apiHandler';

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


/**
 * @swagger
 * /update-subtask-state:
 *   post:
 *     summary: Updates the state of a specific subtask
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: string
 *               subtaskId:
 *                 type: string
 *               newState:
 *                 type: string
 *     responses:
 *       200:
 *         description: The subtask state was successfully updated
 */
app.post('/update-subtask-state', (req: Request, res: Response) => {
    const { taskId, subtaskId, newState } = req.body;
    console.log(taskId, subtaskId, newState)

    try {
        updateSubtaskState(taskId, subtaskId, newState);
        res.status(200).json({ message: 'The subtask state was successfully updated' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating the subtask state' });
    }
});

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Retrieves a list of all tasks
 *     responses:
 *       200:
 *         description: A list of all tasks
 */
app.get('/tasks', (req: Request, res: Response) => {
    try {
        const tasks = getAllTasks();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while retrieving tasks' });
    }
});

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Retrieves a specific task
 *     parameters:
 *      - in: path
 *        name: taskId
 *        schema:
 *          type: string
 *        required: true
 *        description: The task id
 *     responses:
 *       200:
 *         description: A specific task
 */
app.get('/tasks/:taskId', (req: Request, res: Response) => {
    const { taskId } = req.params;

    try {
        const task = getTask(taskId);
        if (task) {
            res.status(200).json(task);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while retrieving the task' });
    }
});


const port = 3000;
app.listen(port, async () => {
    // await client.connect();
    console.log(`Server running on port ${port}`);
});


