import streamlit as st
import pandas as pd
import joblib

# Load Model (Using Random Forest as main model)
model = joblib.load(r"D:\student-risk-prediction\models\random_forest_model.pkl")


st.title("🎓 Student Academic Risk Prediction")

st.write("Enter student details to predict academic risk")

# Input Fields
attendance = st.slider("Attendance Percentage", 0.0, 100.0, 75.0)
assignment = st.slider("Assignment Completion Rate", 0.0, 100.0, 70.0)
internal_marks = st.slider("Internal Marks", 0.0, 100.0, 65.0)
study_hours = st.slider("Study Hours Per Week", 0.0, 60.0, 20.0)
previous_gpa = st.slider("Previous GPA", 0.0, 10.0, 7.0)
participation = st.slider("Participation Score", 0.0, 10.0, 5.0)

# Predict Button
if st.button("Predict Risk"):
    input_data = pd.DataFrame([{
        "attendance_percentage": attendance,
        "assignment_completion_rate": assignment,
        "internal_marks": internal_marks,
        "study_hours_per_week": study_hours,
        "previous_gpa": previous_gpa,
        "participation_score": participation
    }])

    prediction = model.predict(input_data)[0]
    probability = model.predict_proba(input_data)[0][1]

    if prediction == 1:
        st.error(f"⚠ High Academic Risk (Probability: {probability:.2f})")
    else:
        st.success(f"✅ Low Academic Risk (Probability: {probability:.2f})")

st.subheader("📊 Model Performance Metrics")

metrics_df = pd.read_csv("../reports/model_metrics.csv")
st.dataframe(metrics_df)

st.subheader("📈 Dataset Distribution")

data_df = pd.read_csv("../data/student_data.csv")
st.bar_chart(data_df["risk_label"].value_counts())

