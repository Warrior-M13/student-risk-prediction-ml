# 🎓 RiskSense — Student Academic Risk Prediction Dashboard

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-ML-orange?style=flat-square&logo=scikit-learn)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

A full-stack machine learning web dashboard that predicts whether a student is academically at risk based on behavioral and academic indicators.

Built with a **FastAPI backend**, **scikit-learn ML models**, and a fully custom **HTML/CSS/JavaScript frontend** — without relying on UI frameworks.

---

## 🚀 Features

- 4-page interactive dashboard — Overview, Data Analytics, Model Performance, Prediction Tool  
- Real-time ML prediction via FastAPI backend  
- Risk Gauge Meter (canvas-based)  
- ROC Curve Comparison  
- Correlation Heatmap  
- Prediction History + CSV Export  
- Feature Importance Visualization  
- Dataset Explorer (1,000 records)  
- Dark / Light Mode  
- Confusion Matrix  
- Animated KPI counters  

---

## 🧩 Problem Context

Educational institutions often struggle to identify academically at-risk students early enough for effective intervention.

Traditional approaches rely on delayed academic results or manual observation.

**RiskSense solves this by:**
- Detecting early warning patterns  
- Predicting risk using ML  
- Providing interactive insights  
- Supporting data-driven decisions  

---

## 🧠 System Overview

1. Synthetic Data Generation  
2. Data Validation Pipeline  
3. Model Training (LR, RF, SVM)  
4. Model Evaluation  
5. FastAPI Deployment  
6. Interactive Frontend Dashboard  

---

## 🛠️ Tech Stack

### Backend

| Tool | Purpose |
|---|---|
| Python | Core |
| FastAPI | API |
| scikit-learn | ML |
| pandas / numpy | Data |
| joblib | Model saving |
| uvicorn | Server |

### Frontend

| Tool | Purpose |
|---|---|
| HTML/CSS | UI |
| JavaScript | Logic |
| Chart.js | Charts |
| Canvas API | Custom visuals |

---

## 📁 Project Structure

~~~
student-risk-prediction/
│
├── backend/
│   └── main.py
│
├── data/
│   ├── student_data.csv
│   └── student_db.sqlite
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── models/
│   ├── logistic_model.pkl
│   ├── random_forest_model.pkl
│   └── svm_model.pkl
│
├── src/
│   ├── data_generator.py
│   ├── train_model.py
~~~

---

## ⚙️ Setup & Installation

### 1. Clone Repository
~~~bash
git clone https://github.com/your-username/student-risk-prediction.git
cd student-risk-prediction
~~~

### 2. Create Virtual Environment
~~~bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
~~~

### 3. Install Dependencies
~~~bash
pip install fastapi uvicorn scikit-learn pandas numpy joblib matplotlib
~~~

### 4. Generate Dataset
~~~bash
python src/data_generator.py --rows 1000
~~~

### 5. Train Models
~~~bash
python src/train_model.py
~~~

### 6. Start Backend
~~~bash
cd backend
uvicorn main:app --reload
~~~

API: http://localhost:8000

---

## 🔌 API

### GET /
~~~json
{ "message": "Student Risk API running" }
~~~

### POST /predict
~~~json
{
  "model": "rf",
  "features": {
    "attendance_percentage": 75,
    "assignment_completion_rate": 70,
    "internal_marks": 65,
    "study_hours_per_week": 20,
    "previous_gpa": 7.0,
    "participation_score": 5
  }
}
~~~

---

## 📊 Dataset

- Attendance  
- Assignments  
- Marks  
- Study Hours  
- GPA  
- Participation  

**Risk = 1 if ≥ 2 conditions fail**

---

## 🤖 Model Performance

| Model | Accuracy |
|---|---|
| Logistic Regression | 82% |
| Random Forest | **91%** |
| SVM | 87% |

Best Model: Random Forest (AUC = 0.96)

---

## 📊 Key Outcomes

- 91% accuracy achieved  
- Full ML pipeline built  
- Real-time prediction system  
- Practical ML application  

---

## 🌙 Dark Mode

Stored using localStorage. Toggle via UI.

---

## 📈 Future Scope

- What-if simulator  
- Batch predictions  
- SHAP explainability  
- Cloud deployment  
~~~

---

# 🧠 Why this works

- No nested ``` → ✅ no breaking  
- Everything renders properly → ✅  
- One copy-paste → ✅  
- Clean GitHub UI → ✅  

---

If you want next upgrade:
👉 I can add **GIF demo + screenshots section (this massively boosts project impact)**