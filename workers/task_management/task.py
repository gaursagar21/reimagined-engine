import json
from abc import abstractmethod, ABC
from dataclasses import dataclass
from typing import Any

import requests as requests

from logging_config import logger


@dataclass
class TaskPayload:
    """
    Shared payload for all tasks to execute
    """

    task_id: str
    subtask_id: str
    state: str


class Task(ABC):
    def __init__(self, payload: TaskPayload):
        self.task_id = payload.task_id
        self.subtask_id = payload.subtask_id
        logger.info(
            f"Created instance of {self.cls_name} for task_id: {self.task_id} subtask_id: {self.subtask_id}"
        )

    @property
    def cls_name(self):
        return self.__class__.__name__

    @abstractmethod
    def process(self):
        pass

    @abstractmethod
    def save_results(self, results: Any):
        pass

    def update_state(self, state):
        """
        Update state in DB
        """
        logger.info(f"Updating state of {self.subtask_id} to {state}")
        url = "http://127.0.0.1:3000/update-subtask-state"
        headers = {'Content-Type': 'application/json'}
        data = {
            "taskId": self.task_id,
            "subtaskId": self.subtask_id,
            "newState": state
        }
        response = requests.post(url, headers=headers, data=json.dumps(data))

        if response.status_code != 200:
            logger.error(f"Failed to update state. Status code: {response.status_code}. Message: {response.text}")