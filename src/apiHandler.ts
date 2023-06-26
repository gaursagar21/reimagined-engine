import { writeFile } from 'fs/promises';
import redis from 'ioredis';
import { join } from 'path';

const redisClient = new redis();

export async function createFile(filePath: string, count: number): Promise<void> {
    const numbers = Array.from({ length: count }, () => Math.floor(Math.random() * 100));
    const data = numbers.join('\n');
    await writeFile(filePath, data);
}

export async function createTask(C: number, F: number): Promise<void> {
    const filePaths = [];
    for (let i = 0; i < F; i++) {
        const filePath = join(__dirname, `file${i + 1}.csv`);
        filePaths.push(filePath);
        await createFile(filePath, C);
    }

    const taskCount = Math.floor(F / 5);
    for (let i = 0; i < taskCount; i++) {
        const task = {
            task_type: 'compute_mean',
            payload: {
                task_id: `task${i + 1}`,
                subtask_id: `subtask_${i + 1}`,
                file_paths: filePaths.slice(i * 5, (i + 1) * 5),
                result_file: `result${i + 1}.csv`,
            },
        };
        await redisClient.lpush('tasks', JSON.stringify(task));
    }
}
