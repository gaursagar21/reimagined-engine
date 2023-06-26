# Reimagined Engine

## Starting the API server

```bash
npx ts-node-dev src/api.ts
```
It would start a server at localhost:3000. 
API docs would be available in localhost:3000/api-docs

## Manually starting the Workers

```bash
pip install -r requirements.txt
python workers/start_worker.py
```

## Manually Posting a message in Redis

```bash
redis-cli LPUSH subtasks_queue "{\"task_type\": \"compute_mean\", \"payload\": {\"task_id\": \"task001\", \"subtask_id\": \"subtask_001\", \"file_paths\": [\"test1.csv\", \"test2.csv\", \"test3.csv\"], \"result_file\": \"result.csv\"}}"
```
