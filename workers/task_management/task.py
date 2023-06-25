from abc import abstractmethod, ABC
from typing import Any


class Task(ABC):

    @abstractmethod
    def process(self):
        pass

    @abstractmethod
    def save_results(self, results: Any):
        pass
