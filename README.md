# Student Academic Risk Prediction System

## 1. Project Overview

The Student Academic Risk Prediction System is a machine learning–based analytical solution designed to identify students who are at risk of poor academic performance. The system integrates data engineering, machine learning modeling, and interactive visualization into a single reproducible pipeline.

The project demonstrates an end-to-end machine learning workflow starting from synthetic data generation to model deployment through an interactive dashboard.

The system allows academic stakeholders to analyze student performance patterns and predict academic risk in real time using multiple machine learning models.

---

## 2. Problem Statement

Educational institutions often face challenges in identifying students who are likely to perform poorly or drop academically. Traditional identification methods rely on manual observation or delayed academic results, which may not allow timely intervention.

There is a need for a data-driven system that can:

- Analyze student academic behavior patterns  
- Predict students at academic risk early  
- Provide visual insights into performance trends  
- Support decision-making using data analytics  

The objective of this project is to build a predictive system that can classify students into risk categories based on academic and behavioral indicators.

---

## 3. Proposed Solution

This project proposes a machine learning pipeline that:

1. Generates or ingests student performance data  
2. Validates and prepares the dataset  
3. Trains multiple machine learning models  
4. Evaluates models using statistical metrics and cross validation  
5. Deploys the best-performing model inside an interactive dashboard  
6. Allows real-time prediction using user input  

The final system provides both analytical insights and predictive capability.

---

## 4. Technologies and Tools Used

### Programming Language
Python

### Libraries
- Pandas  
- NumPy  
- Scikit-learn  
- Matplotlib  
- Streamlit  

### Development Tools
- VS Code  
- Git and GitHub  

---

## 5. Data Engineering Approach

Since real institutional student datasets may not be publicly available, a synthetic data generator was created. The generator simulates realistic student academic performance metrics including:

- Attendance  
- Assignment completion rate  
- Internal marks  
- Study hours  
- GPA  
- Participation score  

The data pipeline includes:
- Configurable data generation  
- Data validation scripts  
- Automated pipeline execution  
- Reproducible dataset creation  

---

## 6. Machine Learning Models Implemented

### Logistic Regression
Baseline classification model.

### Random Forest Classifier
Captures nonlinear relationships and provides feature importance.

### Support Vector Machine
Handles complex classification boundaries.

---

## 7. Model Evaluation Strategy

Models were evaluated using:

- Accuracy  
- Precision  
- Recall  
- F1 Score  
- 5-Fold Cross Validation  

Cross validation ensures model stability and generalization.

---

## 8. Dashboard and Visualization

The Streamlit dashboard contains:

### Project Overview
Project description and dataset insights.

### Data Analytics (EDA)
- Feature distributions  
- Risk trend scatter plots  
- Boxplots by risk category  
- Correlation heatmap with numerical annotations  

### Model Performance
Evaluation metrics and cross validation results.

### Prediction Tool
Real-time prediction using user input.

---

## 9. Key Features

- End-to-end ML pipeline  
- Synthetic data generation  
- Multi-model evaluation  
- Cross validation  
- Interactive dashboard  
- Real-time prediction  
- Feature importance visualization  

---

## 10. Project Outcome

The system demonstrates how machine learning can help:

- Identify students at academic risk early  
- Provide data-driven academic insights  
- Support academic intervention planning  

---

## 11. Future Scope

- Integration with real datasets  
- Cloud deployment  
- Model explainability (SHAP)  
- Automated retraining pipelines  

---

## 12. Conclusion

This project demonstrates a complete machine learning solution from data engineering to deployment, emphasizing reproducibility, evaluation rigor, and interactive visualization.
