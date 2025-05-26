from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

# Configuración
DEFAULT_CSV = "Breast_Cancer.csv"
RANDOM_STATE = 42

# Helper para informe clínico
def generate_clinical_report(n_samples, accuracy, sensitivity, specificity):
    """Genera un informe médico completo con recomendaciones"""
    return (
        "INFORME DE INTELIGENCIA ARTIFICIAL - ANÁLISIS ONCOLÓGICO\n"
        "=======================================================\n\n"
        f"Análisis realizado sobre {n_samples} muestras de tejido mamario:\n\n"
        "MÉTRICAS PRINCIPALES:\n"
        f"• Precisión Global: {accuracy*100:.1f}%\n"
        f"• Sensibilidad (Detección de Malignos): {sensitivity*100:.1f}%\n"
        f"• Especificidad (Identificación de Benignos): {specificity*100:.1f}%\n\n"
        "INTERPRETACIÓN CLÍNICA:\n"
        "1. Pacientes con alta probabilidad (>85%):\n"
        "   - Recomendación: Biopsia inmediata guiada por imagen\n"
        "   - Considerar resonancia magnética complementaria\n\n"
        "2. Pacientes con probabilidad intermedia (50-85%):\n"
        "   - Recomendación: Ultrasonido mamario de seguimiento\n"
        "   - Repetir prueba en 3-6 meses\n"
        "   - Considerar marcadores tumorales adicionales\n\n"
        "3. Pacientes con baja probabilidad (<50%):\n"
        "   - Recomendación: Seguimiento rutinario\n"
        "   - Autoexamen mensual y control anual\n\n"
        "FACTORES COMPLEMENTARIOS A CONSIDERAR:\n"
        "- Historial familiar de cáncer de mama\n"
        "- Presencia de mutaciones BRCA1/BRCA2\n"
        "- Edad y estado menopáusico del paciente\n"
        "- Densidad mamaria en estudios previos\n\n"
        "NOTA IMPORTANTE:\n"
        "Este informe ha sido generado automáticamente por un sistema de IA y debe\n"
        "ser interpretado por un profesional médico calificado. Los resultados deben\n"
        "correlacionarse con el cuadro clínico completo del paciente."
    )

# Endpoint para análisis
@app.route("/api/analyze", methods=["POST"])
def analyze():
    """Entrena varios clasificadores y devuelve sus métricas"""
    try:
        # Carga del dataset
        df = pd.read_csv(DEFAULT_CSV)
        
        # Separación features / label
        X = df.iloc[:, :-1]
        y = df.iloc[:, -1]
        n_samples = len(df)
        
        # Split estratificado
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, stratify=y, random_state=RANDOM_STATE
        )
        
        # Pre-procesamiento
        preproc = build_preprocessor(X)
        
        # Modelos
        models = {
            "Decision Tree": DecisionTreeClassifier(random_state=RANDOM_STATE),
            "Random Forest": RandomForestClassifier(n_estimators=200, random_state=RANDOM_STATE),
            "SVM": SVC(probability=True, kernel="rbf", C=10, gamma="scale", random_state=RANDOM_STATE),
            "Naive Bayes": GaussianNB(),
            "KNN": KNeighborsClassifier(n_neighbors=5),
            "Logistic Regression": LogisticRegression(max_iter=2000, solver="lbfgs"),
            "MLP": MLPClassifier(max_iter=1500, random_state=RANDOM_STATE)
        }
        
        results = {}
        best_model_name = None
        best_accuracy = -np.inf
        best_metrics = {}
        
        # Entrenamiento y evaluación
        for name, model in models.items():
            pipe = Pipeline(steps=[("prep", preproc), ("clf", model)])
            pipe.fit(X_train, y_train)
            y_pred = pipe.predict(X_test)
            
            proba = pipe.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
            
            tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
            sensitivity = tp / (tp + fn)
            specificity = tn / (tn + fp) if (tn + fp) else np.nan
            
            metrics = {
                "accuracy": accuracy_score(y_test, y_pred),
                "precision": precision_score(y_test, y_pred, zero_division=0),
                "recall": sensitivity,
                "specificity": specificity,
                "f1": f1_score(y_test, y_pred, zero_division=0),
                "roc_auc": roc_auc_score(y_test, proba) if proba is not None else None,
                "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
                "clinical_metrics": {
                    "sensitivity": sensitivity,
                    "specificity": specificity
                }
            }
            
            results[name] = metrics
            
            if metrics["accuracy"] > best_accuracy:
                best_accuracy = metrics["accuracy"]
                best_model_name = name
                best_metrics = metrics
        
        return jsonify({
            "n_samples": n_samples,
            "best_model": best_model_name,
            "metrics": results,
            "best_metrics": best_metrics
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para informe clínico
@app.route("/api/clinical_report", methods=["POST"])
def clinical_report():
    """Genera el informe médico basado en las métricas"""
    try:
        data = request.get_json()
        required_fields = ["n_samples", "accuracy", "sensitivity", "specificity"]
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        report = generate_clinical_report(
            n_samples=data["n_samples"],
            accuracy=data["accuracy"],
            sensitivity=data["sensitivity"],
            specificity=data["specificity"]
        )
        
        return jsonify({
            "report": report,
            "metadata": {
                "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "model_used": "Weka Oncology AI v1.2"
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para recomendaciones
@app.route("/api/recommend", methods=["POST"])
def recommend():
    """Devuelve recomendaciones técnicas para mejorar el modelo"""
    try:
        return jsonify({
            "recommendations": [
                "1. Balanceo de Clases: Aplicar SMOTE para mejorar el balance entre clases",
                "2. Selección de Variables: Utilizar PCA o análisis SHAP para identificar características clave",
                "3. Optimización de Hiperparámetros: Realizar una búsqueda en grid para los mejores parámetros",
                "4. Validación Cruzada: Implementar k-fold (k=10) para una evaluación más robusta",
                "5. Ensamblaje de Modelos: Probar técnicas como VotingClassifier o Stacking"
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)