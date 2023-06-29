import { writeFile, mkdir } from 'fs/promises';
import redis from 'ioredis';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { WorkerManager } from './workerManager';


const redisClient = new redis();
const SUBTASKS_QUEUE: string = "subtasks_queue";
const COMPUTE_MEAN_TASK: string = "compute_mean";
const SUBTASKS_PER_WORKER: number = 5;

function current_time() {
    return Date.now();
  }

async function createFile(filePath: string, count: number): Promise<void> {
    // Create a file with n random numbers in specified location
    const numbers = Array.from({ length: count }, () => Math.floor(Math.random() * 100));
    const data = numbers.join('\n');
    await writeFile(filePath, data);
}

export async function createTask(C: number, F: number): Promise<string> {
    /**
     * This is the main handler for defining a task, creating the files to be processed.
     * Each user task is divided into F / SUBTASKS_PER_WORKER tasks
     * The tasks are submitted to a redis queue.
     * @param {number} C - The number of random numbers to generate in each file.
     * @param {number} F - The total number of files to be created for the task.
     * @returns {Promise<string>} - A promise with taskID if all tasks are successfully submitted
     */
    const taskId = uuidv4();
    const taskFolderPath = join(__dirname, "tasks-log", taskId); 
    await mkdir(taskFolderPath, { recursive: true });

    const filePaths = [];
    for (let i = 0; i < F; i++) {
        const filePath = join(taskFolderPath, `input_${i + 1}.csv`);
        filePaths.push(filePath);
        await createFile(filePath, C);
    }

    const taskCount = Math.ceil(F / SUBTASKS_PER_WORKER);
    console.log(`Adding ${taskCount} subtasks to queue ${SUBTASKS_QUEUE} for ${taskId}`);
    const task: any = {
        task_id: taskId,
        C: C,
        F: F,
        subtasks: [],
        created_on: current_time(),
        updated_on: current_time(),
        state: 'CREATED'
    }
    const subtasks_array = []
    for (let i = 0; i < taskCount; i++) {
        const subtask = {
            task_type: COMPUTE_MEAN_TASK,
            payload: {
                task_id: taskId,
                subtask_id: `${taskId}_subtask_${i + 1}`,
                file_paths: filePaths.slice(i * SUBTASKS_PER_WORKER, (i + 1) * SUBTASKS_PER_WORKER),
                result_file: join(taskFolderPath, `result.csv`),
                state: 'CREATED'
            },
        };
        subtasks_array.push(subtask);
        await redisClient.lpush(SUBTASKS_QUEUE, JSON.stringify(subtask));
    }
    task.subtasks = subtasks_array;
    tasks[taskId] = task;
    return taskId;
}

const workerScriptPath = 'workers/start_worker.py';
const workerArgs = [""];
const workerManager = new WorkerManager(workerScriptPath, workerArgs);

export function spawnWorkersHandler(W: number): void {
    
    workerManager.spawnWorkers(W);
}

export function killWorkersHandler(): number {
    return workerManager.killAllWorkers();
}

const tasks: any = {};

export function updateSubtaskState(taskId: string, subtaskId: string, newState: string): void {
    console.log(`Update ${taskId} ${subtaskId} ${newState}`)
    const task = tasks[taskId];
    if (task) {
        const subtask = task.subtasks.find((subtask: { payload: { subtask_id: string; }; }) => subtask.payload.subtask_id === subtaskId);
        if (subtask) {
            subtask.payload.state = newState;
            aggregateTaskState(taskId);
        }
    }
}

function aggregateTaskState(taskId: string): void {
    const task = tasks[taskId];
    if (task) {
        const states = task.subtasks.map((subtask: { payload: { state: any; }; }) => subtask.payload.state);
        if (states.every((state: string) => state === 'COMPLETED')) {
            task.state = 'COMPLETED';
        } else if (states.some((state: string) => state === 'FAILED')) {
            task.state = 'FAILED';
        } else if (states.some((state: string) => state === 'INPROGRESS')) {
            task.state = 'INPROGRESS';
        }
    }
}

export function getAllTasks(): object {
    return tasks;
}

export function getTask(taskId: string): object {
    return tasks[taskId];
}