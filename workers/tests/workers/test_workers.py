import os
import unittest
import pandas as pd
import numpy as np

from start_worker import SubTask
from task_management.tasks.compute_average import ComputeMeanPayload
from task_management.tasks_factory import TasksFactory


class TestWorkers(unittest.TestCase):
    def setUp(self) -> None:
        # Create some test CSV files
        self.file_paths = ["test1.csv", "test2.csv", "test3.csv"]
        self.result_file_path = "result.csv"
        self.lock_file_path = f"{self.result_file_path}.task001.lock"
        self.intermediate_results_file_path = (
            f"{self.result_file_path}.task001.intermediate.csv"
        )

        pd.DataFrame(np.array([[1, 2, 3, 4]])).T.to_csv(
            self.file_paths[0], index=False, header=False
        )
        pd.DataFrame(np.array([[2, 3, 4, 5]])).T.to_csv(
            self.file_paths[1], index=False, header=False
        )
        pd.DataFrame(np.array([[3, 4, 5, 6]])).T.to_csv(
            self.file_paths[2], index=False, header=False
        )

    def tearDown(self):
        # Remove the test CSV files
        for file in self.file_paths + [
            self.result_file_path,
            self.lock_file_path,
            self.intermediate_results_file_path,
        ]:
            if os.path.exists(file):
                os.remove(file)

    def test_compute_mean_worker(self):
        subtask_obj: SubTask = SubTask(
            task_type="compute_mean",
            payload=ComputeMeanPayload(
                task_id="task001",
                subtask_id="subtask_001",
                file_paths=self.file_paths,
                result_file=self.result_file_path,
            ),
        )
        task_type = subtask_obj.task_type
        task_instance = TasksFactory.create_task(task_type, subtask_obj.payload)
        task_instance.process()

        # Check that the result file was created
        self.assertTrue(os.path.exists(self.result_file_path))

        # Check that the result file contains the correct values
        result = pd.read_csv(self.result_file_path, header=None)
        expected_result = pd.DataFrame(np.array([[2.0, 3.0, 4.0, 5.0]])).T
        pd.testing.assert_frame_equal(result, expected_result)
