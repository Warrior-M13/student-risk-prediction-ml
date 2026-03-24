import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import cross_val_score
import joblib
import sqlite3
import os

# Load dataset from SQLite DB
conn = sqlite3.connect("data/student_db.sqlite")
df = pd.read_sql("SELECT * FROM students", conn)
conn.close()

# Features and Target
X = df.drop("risk_label", axis=1)
y = df["risk_label"]

# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create Models (tuned hyperparameters)
log_model = LogisticRegression(max_iter=2000, C=0.8, random_state=42)
rf_model  = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
svm_model = SVC(probability=True, C=1.5, kernel='rbf', random_state=42)

# Train Models
log_model.fit(X_train, y_train)
rf_model.fit(X_train, y_train)
svm_model.fit(X_train, y_train)

# Predictions
log_pred = log_model.predict(X_test)
rf_pred  = rf_model.predict(X_test)
svm_pred = svm_model.predict(X_test)

# Evaluation Function
def evaluate_model(name, y_true, y_pred):
    print(f"\n{name} Results")
    print("Accuracy:",  accuracy_score(y_true, y_pred))
    print("Precision:", precision_score(y_true, y_pred))
    print("Recall:",    recall_score(y_true, y_pred))
    print("F1 Score:",  f1_score(y_true, y_pred))

# Evaluate Models
evaluate_model("Logistic Regression", y_test, log_pred)
evaluate_model("Random Forest",       y_test, rf_pred)
evaluate_model("SVM",                 y_test, svm_pred)

# Create models folder if not exists
os.makedirs("models", exist_ok=True)

# Save Models
joblib.dump(log_model, "models/logistic_model.pkl")
joblib.dump(rf_model,  "models/random_forest_model.pkl")
joblib.dump(svm_model, "models/svm_model.pkl")

print("\nModels saved successfully in models/ folder")

# Store metrics in dictionary
metrics_data = [
    {
        "Model": "Logistic Regression",
        "Accuracy":  accuracy_score(y_test, log_pred),
        "Precision": precision_score(y_test, log_pred),
        "Recall":    recall_score(y_test, log_pred),
        "F1 Score":  f1_score(y_test, log_pred)
    },
    {
        "Model": "Random Forest",
        "Accuracy":  accuracy_score(y_test, rf_pred),
        "Precision": precision_score(y_test, rf_pred),
        "Recall":    recall_score(y_test, rf_pred),
        "F1 Score":  f1_score(y_test, rf_pred)
    },
    {
        "Model": "SVM",
        "Accuracy":  accuracy_score(y_test, svm_pred),
        "Precision": precision_score(y_test, svm_pred),
        "Recall":    recall_score(y_test, svm_pred),
        "F1 Score":  f1_score(y_test, svm_pred)
    }
]

# Convert to DataFrame
metrics_df = pd.DataFrame(metrics_data)

# Ensure reports folder exists
os.makedirs("reports", exist_ok=True)

# Save CSV
metrics_df.to_csv("reports/model_metrics.csv", index=False)

print("\nMetrics saved to reports/model_metrics.csv")

print("\nCross Validation Scores:")

log_cv  = cross_val_score(log_model, X, y, cv=5, scoring="f1")
rf_cv   = cross_val_score(rf_model,  X, y, cv=5, scoring="f1")
svm_cv  = cross_val_score(svm_model, X, y, cv=5, scoring="f1")

print("Logistic Regression CV F1:", log_cv.mean())
print("Random Forest CV F1:",       rf_cv.mean())
print("SVM CV F1:",                 svm_cv.mean())

# Save Cross Validation Results
cv_results = pd.DataFrame({
    "Model": ["Logistic Regression", "Random Forest", "SVM"],
    "CV_F1_Score": [log_cv.mean(), rf_cv.mean(), svm_cv.mean()]
})

cv_results.to_csv("reports/cv_results.csv", index=False)

print("\nCross Validation results saved to reports/cv_results.csv")

# Create Model Comparison Chart
plt.figure()
plt.bar(cv_results["Model"], cv_results["CV_F1_Score"])
plt.title("Model Comparison (CV F1 Score)")
plt.xlabel("Model")
plt.ylabel("F1 Score")
plt.savefig("reports/model_comparison_chart.png")

print("Model comparison chart saved to reports/model_comparison_chart.png")