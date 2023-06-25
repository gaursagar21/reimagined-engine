import swaggerUi from 'swagger-ui-express';
import specs from './swaggerOptions';
import express, { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { WorkerManager } from './workerManager';

const app = express();
app.use(express.json());

const dbUri = 'mongodb://localhost:27017';
const client = new MongoClient(dbUri);


const workerScriptPath = './workers/worker.py'; // replace with your Python worker script path
const workerArgs = ['arg1', 'arg2']; // replace with your actual arguments
const workerManager = new WorkerManager(workerScriptPath, workerArgs);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /spawnWorkers:
 *   post:
 *     summary: Spawns a worker
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
app.post('/spawnWorkers', (req: Request, res: Response) => {
    const { W } = req.body;

    if (typeof W !== 'number' || W < 1) {
        return res.status(400).json({ message: 'Invalid worker count. Must be a positive integer.' });
    }

    workerManager.spawnWorkers(W);
    const msg = `Spawned ${W} workers.`
    console.log(msg)
    res.status(200).json({ message: msg });
});

/**
 * @swagger
 * /killWorkers:
 *   delete:
 *     summary: delete all spawned workers
 *     responses:
 *       200:
 *         description: The worker was successfully spawned
 */
app.delete('/killWorkers', (req: Request, res: Response) => {

    const count = workerManager.killAllWorkers();
    res.status(200).json({ message: `Killed ${count} workers.` });
});


/**
 * @swagger
 * /createTask:
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
app.post('/createTask', async (req: Request, res: Response) => {
    const { C, F } = req.body;
    // Split the task into subtasks when F > 5
    const subtasks: string[][] = [];
    for (let i = 0; i < F; i += 5) {
        const subtaskFiles : string[] = [];
        for (let j = i; j < i + 5 && j < F; j++) {
            const filename = `file_${uuidv4()}.csv`;
            // Generate a file with C random numbers
            // saveFile(filename, C);
            subtaskFiles.push(filename);
        }
        subtasks.push(subtaskFiles);
    }
    const db = client.db('task_db');
    const result = await db.collection('tasks').insertOne({ C, F, subtasks, status: 'QUEUED', createdOn: Date.now(), updatedOn: Date.now() });
    // enqueue(result.insertedId);
    res.status(201).send({ taskId: result.insertedId });
});

// /**
//  * @swagger
//  * /systemStatus:
//  *   get:
//  *     summary: Returns the status of the system
//  *     responses:
//  *       200:
//  *         description: The status of the system
//  */
// app.get('/systemStatus', async (req: Request, res: Response) => {
//     // Fetch the system status information
//     const db = client.db('task_db');
//     const tasks = await db.collection('tasks').find({}).toArray();
//     const status = {
//         totalTasks: tasks.length,
//         completedTasks: tasks.filter(task => task.status === 'SUCCESS').length,
//         failedTasks: tasks.filter(task => task.status === 'FAILURE').length,
//         queuedTasks: tasks.filter(task => task.status === 'QUEUED').length,
//         workerCount: workerCount
//     };
//     res.status(200).send(status);
// });

const port = 3000;
app.listen(port, async () => {
    await client.connect();
    console.log(`Server running on port ${port}`);
});
