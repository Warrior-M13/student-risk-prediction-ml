import pandas as pd
import numpy as np
import os

# Number of students to generate
num_students = 1000

# Set random seed for reproducibility
np.random.seed(42)

# Generate synthetic student data
attendance = np.random.uniform(40, 100, num_students)
assignment_completion = np.random.uniform(30, 100, num_students)
internal_marks = np.random.uniform(30, 100, num_students)
study_hours = np.random.uniform(5, 40, num_students)
previous_gpa = np.random.uniform(4, 10, num_students)
participation = np.random.uniform(1, 10, num_students)

# Risk calculation logic
risk_score = (
    (attendance < 60).astype(int) +
    (assignment_completion < 60).astype(int) +
    (internal_marks < 50).astype(int) +
    (study_hours < 15).astype(int) +
    (previous_gpa < 6).astype(int)
)

# Convert risk score to binary label
risk_label = (risk_score >= 2).astype(int)

# Create DataFrame
df = pd.DataFrame({
    "attendance_percentage": attendance,
    "assignment_completion_rate": assignment_completion,
    "internal_marks": internal_marks,
    "study_hours_per_week": study_hours,
    "previous_gpa": previous_gpa,
    "participation_score": participation,
    "risk_label": risk_label
})

# Ensure data folder exists
os.makedirs("data", exist_ok=True)

# Save dataset
df.to_csv("data/student_data.csv", index=False)

print("Dataset generated successfully!")
print("Saved to: data/student_data.csv")
