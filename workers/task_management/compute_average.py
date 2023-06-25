import os
from dataclasses import dataclass
from typing import List

import pandas as pd
from filelock import FileLock

from workers.task_management.task import Task


@dataclass
class ComputeMeanPayload:
    file_paths: List[str]
    result_file: str


class ComputeMeanTask(Task):
    def __init__(self, payload: ComputeMeanPayload):
        self.file_paths = payload.file_paths
        self.result_file_path = payload.result_file
        self.lock_file_path = f"{payload.result_file}.lock"

    def validate(self):
        if len(self.file_paths) > 5:
            raise ValueError("This function can only process up to 5 files at a time.")

    def compute_mean(self):
        dfs = [
            pd.read_csv(file_path, header=None) for file_path in self.file_paths
        ]
        # Concatenate all dataframes along the column axis
        c_df = pd.concat(dfs, axis=1)

        # Compute the mean along the column axis
        return c_df.mean(axis=1)

    def save_results(self, results):
        with FileLock(self.lock_file_path):
            # If the result file already exists, read the existing values
            if os.path.exists(self.result_file_path):
                existing_df = pd.read_csv(self.result_file_path, header=None)

                # Compute the new mean
                c_df = pd.concat([existing_df, results], axis=0)
                results = c_df.mean(axis=1)

            # Write the mean values to the result file
            results.T.to_csv(self.result_file_path, header=False, index=False)

    def process(self):
        mean = self.compute_mean()
        self.save_results(mean)
