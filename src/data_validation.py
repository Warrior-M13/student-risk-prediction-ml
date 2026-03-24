import pandas as pd
import sqlite3

conn = sqlite3.connect("data/student_db.sqlite")
df = pd.read_sql("SELECT * FROM students", conn)
conn.close()

print("Checking Missing Values...")
print(df.isnull().sum())

print("\nChecking Value Ranges...")
print(df.describe())

print("\nChecking Class Balance...")
print(df["risk_label"].value_counts())

print("\nData Validation Completed")