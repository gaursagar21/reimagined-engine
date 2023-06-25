from typing import Callable, ClassVar

from logging_config import logger
from task_management.task import Task


class TasksFactory:
    _registry: ClassVar[dict] = dict()

    @classmethod
    def register(cls, task_type: str, name: str) -> Callable:
        """
        Method to register a task implementation given its task_type and a descriptive name.
        args:
            task_type (str): Task type used to identify the task
            name (str): More descriptive human-readable name for a task
        """

        def _register(class_to_register: Task):
            if task_type not in cls._registry:
                cls._registry[task_type] = {
                    "clazz": class_to_register,
                    "name": name,
                    "task_type": task_type,
                }
            return class_to_register

        return _register

    @classmethod
    def create_task(cls, task_type: str, *args, **kwargs) -> Task:
        """
        Create an instance of a Task given type
        """
        registry_record = cls._registry[task_type]
        clazz = registry_record.get("clazz")
        logger.info(
            f"Creating the instance for class name:{registry_record.get('name')} with id : {task_type}"
        )
        instance = clazz(*args, **kwargs)
        return instance
