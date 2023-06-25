"""
Task to illustrate extensibility of the Tasks framework
"""
from dataclasses import dataclass
from typing import List

from task_management.task import Task, TaskPayload
from task_management.tasks_factory import TasksFactory


@dataclass
class ComputeSumPayload(TaskPayload):
    file_paths: List[str]
    result_file: str


@TasksFactory.register(task_type="compute_sum", name="Sum Compute Task")
class ComputeSumTask(Task):
    def __init__(self, payload: ComputeSumPayload):
        super().__init__(payload)
        raise NotImplementedError("This task isn't implemented yet")

    def validate(self):
        pass

    def compute_sum(self):
        pass

    def save_results(self, result):
        pass

    def process(self):
        pass
