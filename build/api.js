"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const dbUri = 'mongodb://localhost:27017';
const client = new mongodb_1.MongoClient(dbUri);
let workerCount = 0;
/**
 * @swagger
 * /spawnWorker:
 *   post:
 *     summary: Spawns a worker
 *     responses:
 *       200:
 *         description: The worker was successfully spawned
 */
app.post('/spawnWorker', (req, res) => {
    const python = (0, child_process_1.spawn)('python', ['worker.py', workerCount.toString()]);
    python.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    python.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    python.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
    workerCount += 1;
    res.status(200).send({ message: `Worker ${workerCount} spawned` });
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
app.post('/createTask', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { C, F } = req.body;
    // Split the task into subtasks when F > 5
    const subtasks = [];
    for (let i = 0; i < F; i += 5) {
        const subtaskFiles = [];
        for (let j = i; j < i + 5 && j < F; j++) {
            const filename = `file_${(0, uuid_1.v4)()}.csv`;
            // Generate a file with C random numbers
            // saveFile(filename, C);
            subtaskFiles.push(filename);
        }
        subtasks.push(subtaskFiles);
    }
    const db = client.db('task_db');
    const result = yield db.collection('tasks').insertOne({ C, F, subtasks, status: 'QUEUED', createdOn: Date.now(), updatedOn: Date.now() });
    // enqueue(result.insertedId);
    res.status(201).send({ taskId: result.insertedId });
}));
/**
 * @swagger
 * /systemStatus:
 *   get:
 *     summary: Returns the status of the system
 *     responses:
 *       200:
 *         description: The status of the system
 */
app.get('/systemStatus', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch the system status information
    const db = client.db('task_db');
    const tasks = yield db.collection('tasks').find({}).toArray();
    const status = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'SUCCESS').length,
        failedTasks: tasks.filter(task => task.status === 'FAILURE').length,
        queuedTasks: tasks.filter(task => task.status === 'QUEUED').length,
        workerCount: workerCount
    };
    res.status(200).send(status);
}));
const port = 3000;
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    yield client.connect();
    console.log(`Server running on port ${port}`);
}));
