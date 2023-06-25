import logging
from time import sleep
from typing import Any
from dataclasses import dataclass
from dataclasses_json import dataclass_json
import json

from logging_config import logger
from task_management.tasks_factory import TasksFactory
import redis

# Initialize Redis client
r = redis.Redis()


@dataclass_json
@dataclass
class SubTask:
    task_type: str
    payload: Any


def process_subtask(subtask_string):
    subtask_dict = json.loads(subtask_string)
    subtask_obj: SubTask = SubTask.from_dict(subtask_dict)
    task_type = subtask_obj.task_type
    task_instance = TasksFactory.create_task(task_type, subtask_obj.payload)
    task_instance.process()


def worker():
    while True:
        _, subtask_string = r.brpop("subtasks_queue", 0)
        process_subtask(subtask_string)
        sleep(0.5)


if __name__ == "__main__":
    logger.info("Started python worker")
    worker()
