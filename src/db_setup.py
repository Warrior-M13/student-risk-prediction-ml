import pandas as pd
import sqlite3

# Load CSV
df = pd.read_csv("data/student_data.csv")

# Create DB
conn = sqlite3.connect("data/student_db.sqlite")

# Save to DB
df.to_sql("students", conn, if_exists="replace", index=False)

conn.close()

print("Database created successfully")
