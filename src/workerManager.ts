import { spawn, ChildProcess } from 'child_process';

export class WorkerManager {
    private workerPool: Record<string, ChildProcess> = {};
    private workerScriptPath: string;
    private args: string[];

    constructor(workerScriptPath: string, args: string[]) {
        this.workerScriptPath = workerScriptPath;
        this.args = args;
    }

    /**
     * Spawn a specified number of workers.
     * @param count The number of workers to spawn.
     */
    spawnWorkers(count: number): void {
        for (let i = 0; i < count; i++) {
            this.spawnWorker(i.toString());
        }
    }

    /**
     * Spawn a worker with a specific ID.
     * @param workerId The ID to assign to the worker.
     */
    spawnWorker(workerId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const workerProcess = spawn('python', [this.workerScriptPath, ...this.args]);

            let workerOutput = '';
            workerProcess.stdout.on('data', (data) => {
                workerOutput += data;
                console.log(`Worker ${workerId} stdout: ${data}`);
            });

            workerProcess.stderr.on('data', (data) => {
                console.error(`Worker ${workerId} error stderr: ${data}`);
            });

            workerProcess.on('close', (returnCode) => {
                console.log(`Worker ${workerId} exited with return code ${returnCode}`);
                resolve(workerOutput);
            });

            workerProcess.on('error', (err) => {
                console.error(`Failed to start worker ${workerId}: ${err}`);
                reject(err);
            });

            this.workerPool[workerId] = workerProcess;
        });
    }

    /**
     * Kill a worker with a specific ID.
     * @param workerId The ID of the worker to kill.
     */
    killWorker(workerId: string): void {
        this.workerPool[workerId].kill();
        delete this.workerPool[workerId];
    }

    /**
     * Kill all workers.
     */
    killAllWorkers(): number {
        const workerCount: number = this.getWorkerCount();
        for (const workerId in this.workerPool) {
            this.killWorker(workerId);
        }
        return workerCount;
    }

    /**
     * Kill a specified number of workers.
     * @param n The number of workers to kill.
     */
    killNWorkers(n: number): void {
        for (const workerId in this.workerPool) {
            if (n <= 0)
                break;
            this.killWorker(workerId);
            n -= 1;
        }
    }

    /**
    * Get the current number of workers.
    * @return The number of workers.
    */
    getWorkerCount(): number {
        return Object.keys(this.workerPool).length;
    }
}
