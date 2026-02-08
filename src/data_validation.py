import pandas as pd

df = pd.read_csv("data/student_data.csv")

print("Checking Missing Values...")
print(df.isnull().sum())

print("\nChecking Value Ranges...")
print(df.describe())

print("\nChecking Class Balance...")
print(df["risk_label"].value_counts())

print("\nData Validation Completed")
