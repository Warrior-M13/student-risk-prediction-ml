import streamlit as st
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import numpy as np
import sqlite3

# ---------------- PATHS ----------------
RF_MODEL_PATH = r"D:\student-risk-prediction\models\random_forest_model.pkl"
LOG_MODEL_PATH = r"D:\student-risk-prediction\models\logistic_model.pkl"
SVM_MODEL_PATH = r"D:\student-risk-prediction\models\svm_model.pkl"

METRICS_PATH = r"D:\student-risk-prediction\reports\model_metrics.csv"
CV_RESULTS_PATH = r"D:\student-risk-prediction\reports\cv_results.csv"
MODEL_CHART_PATH = r"D:\student-risk-prediction\reports\model_comparison_chart.png"

DATA_PATH = r"D:\student-risk-prediction\data\student_data.csv"

# ---------------- LOAD DATA ----------------
conn = sqlite3.connect("data/student_db.sqlite")
data_df = pd.read_sql("SELECT * FROM students", conn)
conn.close()

metrics_df = pd.read_csv(METRICS_PATH)
cv_df = pd.read_csv(CV_RESULTS_PATH)

# ---------------- SIDEBAR NAV ----------------
st.sidebar.title("Navigation")

page = st.sidebar.radio(
    "Go To",
    ["Project Overview", "Data Analytics", "Model Performance", "Prediction Tool"]
)

# =================================================
# 🏠 OVERVIEW PAGE (TEXT + KPI + VISUALS)
# =================================================
if page == "Project Overview":

    st.title("🎓 Student Academic Risk Prediction Dashboard")

    # -------- ORIGINAL TEXT --------
    st.markdown("""
    ### Project Objective
    Predict students at academic risk using Machine Learning models.

    ### Models Used
    - Logistic Regression  
    - Random Forest  
    - Support Vector Machine  

    ### Key Features
    - Synthetic Data Generation  
    - Cross Validation Evaluation  
    - Interactive Dashboard  
    - Real-time Risk Prediction  
    """)

    st.divider()

    # -------- KPI CARDS --------
    st.subheader("📊 Key Dataset Insights")

    total_students = len(data_df)
    risk_percent = data_df["risk_label"].mean() * 100
    avg_gpa = data_df["previous_gpa"].mean()
    avg_attendance = data_df["attendance_percentage"].mean()

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Students", total_students)
    c2.metric("At Risk %", f"{risk_percent:.1f}%")
    c3.metric("Average GPA", f"{avg_gpa:.2f}")
    c4.metric("Avg Attendance", f"{avg_attendance:.1f}%")

    st.divider()

    # -------- VISUALS --------
    st.subheader("📈 Risk Distribution")
    st.bar_chart(data_df["risk_label"].value_counts())

    st.subheader("🤖 Model Comparison Snapshot")
    st.image(MODEL_CHART_PATH)

# =================================================
# 📊 EDA PAGE
# =================================================
elif page == "Data Analytics":

    st.title("📊 Dataset Analytics")

    numeric_cols = data_df.drop("risk_label", axis=1).columns

    # ---------- HISTOGRAM GRID ----------
    st.subheader("Feature Distributions")
    cols = st.columns(3)

    for i, col_name in enumerate(numeric_cols):
        with cols[i % 3]:
            fig, ax = plt.subplots(figsize=(3,2))
            ax.hist(data_df[col_name], bins=20)
            ax.set_title(col_name, fontsize=8)
            st.pyplot(fig)

    # ---------- RISK TREND ----------
    st.subheader("Risk Trend Analysis")

    trend_features = [
        "attendance_percentage",
        "previous_gpa",
        "study_hours_per_week"
    ]

    cols2 = st.columns(3)

    for i, col_name in enumerate(trend_features):
        with cols2[i]:
            fig, ax = plt.subplots(figsize=(3,2))
            ax.scatter(data_df[col_name], data_df["risk_label"], alpha=0.3)
            ax.set_title(f"Risk vs {col_name}", fontsize=8)
            st.pyplot(fig)

    # ---------- BOXPLOTS ----------
    st.subheader("Feature Comparison by Risk")

    cols3 = st.columns(2)

    for i, col_name in enumerate(numeric_cols):
        with cols3[i % 2]:
            fig, ax = plt.subplots(figsize=(4,2))
            data_df.boxplot(column=col_name, by="risk_label", vert=False, ax=ax)
            plt.suptitle("")
            st.pyplot(fig)

    # ---------- HEATMAP ----------
    st.subheader("Correlation Heatmap")

    corr = data_df.corr()

    fig, ax = plt.subplots(figsize=(7,6))
    im = ax.imshow(corr, cmap="coolwarm")

    for i in range(len(corr)):
        for j in range(len(corr.columns)):
            value = corr.iloc[i, j]
            color = "white" if abs(value) > 0.5 else "black"
            ax.text(j, i, f"{value:.2f}", ha="center", va="center", color=color, fontsize=8)

    ax.set_xticks(range(len(corr.columns)))
    ax.set_yticks(range(len(corr.columns)))
    ax.set_xticklabels(corr.columns, rotation=45, ha="right", fontsize=8)
    ax.set_yticklabels(corr.columns, fontsize=8)

    fig.colorbar(im)
    st.pyplot(fig)

# =================================================
# 📈 MODEL PERFORMANCE PAGE
# =================================================
elif page == "Model Performance":

    st.title("📈 Model Performance")

    st.subheader("Model Metrics")
    st.dataframe(metrics_df)

    st.subheader("Cross Validation Scores")
    st.dataframe(cv_df)

    st.subheader("Model Comparison Chart")
    st.image(MODEL_CHART_PATH)

# =================================================
# 🧠 PREDICTION PAGE
# =================================================
elif page == "Prediction Tool":

    st.title("🧠 Academic Risk Prediction Tool")

    model_option = st.selectbox(
        "Select Model",
        ["Random Forest", "Logistic Regression", "SVM"]
    )

    if model_option == "Random Forest":
        model = joblib.load(RF_MODEL_PATH)
    elif model_option == "Logistic Regression":
        model = joblib.load(LOG_MODEL_PATH)
    else:
        model = joblib.load(SVM_MODEL_PATH)

    st.subheader("Enter Student Details")

    attendance = st.slider("Attendance", 0.0, 100.0, 75.0)
    assignment = st.slider("Assignment Completion", 0.0, 100.0, 70.0)
    internal_marks = st.slider("Internal Marks", 0.0, 100.0, 65.0)
    study_hours = st.slider("Study Hours", 0.0, 60.0, 20.0)
    previous_gpa = st.slider("Previous GPA", 0.0, 10.0, 7.0)
    participation = st.slider("Participation Score", 0.0, 10.0, 5.0)

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

        if hasattr(model, "predict_proba"):
            probability = model.predict_proba(input_data)[0][1]
        else:
            probability = 0.5

        if prediction == 1:
            st.error(f"High Risk (Prob: {probability:.2f})")
        else:
            st.success(f"Low Risk (Prob: {probability:.2f})")

        st.subheader("Risk Gauge")
        st.progress(float(probability))

        if model_option == "Random Forest":
            st.subheader("Feature Importance")
            fig2, ax2 = plt.subplots()
            ax2.barh(input_data.columns, model.feature_importances_)
            st.pyplot(fig2)

        result_df = input_data.copy()
        result_df["Prediction"] = prediction
        result_df["Risk_Probability"] = probability

        st.download_button(
            "Download Prediction",
            result_df.to_csv(index=False).encode(),
            "prediction.csv",
            "text/csv"
        )
