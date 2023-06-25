from abc import abstractmethod, ABC
from dataclasses import dataclass
from typing import Any

from logging_config import logger


@dataclass
class TaskPayload:
    """
    Shared payload for all tasks to execute
    """

    task_id: str
    subtask_id: str


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

    def update_state(self):
        """
        Update state in DB
        """
        pass
