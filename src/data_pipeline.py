import subprocess
import sys

print("Running Data Generator...")
subprocess.run([sys.executable, "src/data_generator.py"])

print("\nRunning Data Validation...")
subprocess.run([sys.executable, "src/data_validation.py"])

print("\nData Pipeline Completed")
