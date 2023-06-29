import logging
import os
from dataclasses import dataclass
from typing import List, Any

import pandas as pd
from dataclasses_json import dataclass_json
from filelock import FileLock

from task_management.task import Task, TaskPayload
from task_management.tasks_factory import TasksFactory


@dataclass_json
@dataclass
class ComputeMeanPayload(TaskPayload):
    file_paths: List[str]
    result_file: str


@TasksFactory.register(task_type="compute_mean", name="Mean Compute Task")
class ComputeMeanTask(Task):
    def __init__(self, payload: Any):
        if isinstance(payload, dict):
            payload = ComputeMeanPayload.from_dict(payload)
        self.file_paths = payload.file_paths
        self.result_file_path = payload.result_file
        self.lock_file_path = f"{payload.result_file}.{payload.task_id}.lock"
        super().__init__(payload)

    def validate(self):
        if len(self.file_paths) > 5:
            raise ValueError("This function can only process up to 5 files at a time.")

    def compute_mean(self):
        """
        Computing mean is divided in two parts
        - intermediate mean
        - overall mean
        Each worker saves their individual mean, and the final mean is consolidated at the end of a task

        This way a subtask need not be aware how many other subtasks are to be computed.
        """
        dfs = [
            pd.read_csv(file_path, header=None) for file_path in self.file_paths
        ]
        # Concatenate all dataframes along the column axis
        c_df = pd.concat(dfs, axis=1)

        # Compute the sum along the column axis
        sum_values = c_df.sum(axis=1)
        return pd.concat([sum_values, pd.Series(len(dfs))], ignore_index=True)

    def save_results(self, result):
        # Path to the intermediate file
        intermediate_file_path = f"{self.result_file_path}.{self.task_id}.intermediate.csv"

        with FileLock(self.lock_file_path):
            # If the intermediate file already exists, read the existing totals
            if os.path.exists(intermediate_file_path):
                existing_totals_df = pd.read_csv(intermediate_file_path, header=None)
                existing_totals_series = existing_totals_df.squeeze()
                # Add the new sum values to the existing totals
                new_totals = existing_totals_series + result
            else:
                # If the intermediate file does not exist, it will be created
                new_totals = result

            # Write the new totals to the intermediate file
            new_totals.to_csv(intermediate_file_path, index=False, header=False)

            # Compute the final results and save it to results file
            totals_df = pd.read_csv(intermediate_file_path, header=None)
            mean_df = totals_df.iloc[:-1] / totals_df.iloc[-1]
            mean_df.to_csv(self.result_file_path, index=False, header=False)

    def process(self):
        try:
            logging.info(f"Started processing task: {self.task_id} subtask: {self.subtask_id}")
            state="INPROGRESS"
            self.update_state(state=state)
            result = self.compute_mean()
            self.save_results(result)
            state="COMPLETED"
            logging.info(f"Finished processing task: {self.task_id} subtask: {self.subtask_id}")
        except Exception as ex:
            logging.exception(f"Error processing task: {self.task_id} subtask: {self.subtask_id} {ex}")
            state = "FAILURE"
            raise
        finally:
            self.update_state(state=state)

