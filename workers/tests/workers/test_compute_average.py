import os
import unittest
import pandas as pd
import numpy as np

from task_management.tasks.compute_average import ComputeMeanPayload, ComputeMeanTask


class TestComputeMeanTask(unittest.TestCase):
    def setUp(self):
        # Create some test CSV files
        self.file_paths = ["test1.csv", "test2.csv"]
        self.result_file_path = "result.csv"
        self.lock_file_path = f"{self.result_file_path}.task001.lock"
        self.intermediate_results_file_path = f"{self.result_file_path}.task001.intermediate.csv"

        pd.DataFrame(np.array([[1, 2, 3, 4]])).T.to_csv(
            self.file_paths[0], index=False, header=False
        )
        pd.DataFrame(np.array([[2, 3, 4, 5]])).T.to_csv(
            self.file_paths[1], index=False, header=False
        )

    def tearDown(self):
        # Remove the test CSV files
        for file in self.file_paths + [self.result_file_path, self.lock_file_path, self.intermediate_results_file_path]:
            if os.path.exists(file):
                os.remove(file)

    def test_compute_mean_task(self):
        payload = ComputeMeanPayload(
            task_id="task001",
            subtask_id="subtask_001",
            file_paths=self.file_paths,
            result_file=self.result_file_path,
        )
        task = ComputeMeanTask(payload)
        task.process()

        # Check that the result file was created
        self.assertTrue(os.path.exists(self.result_file_path))

        # Check that the result file contains the correct values
        result = pd.read_csv(self.result_file_path, header=None)
        expected_result = pd.DataFrame(np.array([[1.5, 2.5, 3.5, 4.5]])).T
        pd.testing.assert_frame_equal(result, expected_result)
