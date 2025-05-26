import React, { useState, useRef } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import 'chart.js/auto';
import 'jspdf-autotable';

const ProjectWeka = () => {
  // ── Estados ──────────────────────────────────────────
  const [fileContent, setFileContent] = useState('');
  const [algorithm, setAlgorithm] = useState('decision-tree');
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recs, setRecs] = useState(null);
  const [clinicalReport, setClinicalReport] = useState(null);
  const fileInputRef = useRef(null);

  // ── Datos para gráficos ──────────────────────────────
  const performanceData = {
    labels: ['Precisión','Recall','F1‑Score','ROC AUC'],
    datasets: [{
      label: 'Métricas',
      data: results ? [
        results.accuracy,
        results.metrics.recall,
        results.metrics.f1,
        results.metrics.roc,
      ] : [0,0,0,0],
      backgroundColor: 'rgba(63,81,181,0.7)',
      borderColor: 'rgba(63,81,181,1)',
      borderWidth: 2,
    }],
  };

  // ── Notificaciones ───────────────────────────────────
  const showNotification = (msg, type = 'info') => {
    const id = Date.now();
    setNotifications(n => [...n, {id, msg, type}]);
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 5000);
  };

  // ── Manejo de archivos ───────────────────────────────
  const handleFileUpload = e => {
    const file = e.target.files[0];
    if(!file) return;
    
    setFileInfo({
      name: file.name,
      size: `${(file.size/1024).toFixed(2)} KB`,
      type: file.type || file.name.split('.').pop().toUpperCase(),
    });
    
    const reader = new FileReader();
    reader.onload = ev => {
      setFileContent(ev.target.result);
      showNotification(`Archivo ${file.name} cargado`, 'success');
    };
    reader.onerror = () => showNotification('Error al leer archivo', 'error');
    reader.readAsText(file);
  };

  // ── Procesamiento simulado ───────────────────────────
  const handleProcess = () => {
    if(!fileContent) {
      showNotification('Carga un dataset primero', 'warning');
      return;
    }
    
    setIsProcessing(true);
    showNotification('Procesando…', 'info');
    
    setTimeout(() => {
      setResults({
        accuracy: 0.92,
        confusionMatrix: [[120, 8], [5, 115]],
        metrics: {
          precision: 0.92, 
          recall: 0.89, 
          f1: 0.91, 
          roc: 0.94,
          specificity: 0.97
        },
      });
      setIsProcessing(false);
      showNotification('¡Análisis completado!', 'success');
    }, 3000);
  };

  // ── Obtener recomendaciones ──────────────────────────
  const handleRecommend = async () => {
    if(!fileContent) {
      showNotification('Carga un dataset primero', 'warning');
      return;
    }
    
    showNotification('Obteniendo recomendaciones…', 'info');
    
    try {
      const resp = await fetch('http://127.0.0.1:5000/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset: fileContent })
      });
      const body = await resp.json();
      setRecs(body.recommendations);
      showNotification('Recomendaciones recibidas', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Error al obtener recomendaciones', 'error');
    }
  };

  // ── Generar informe clínico ──────────────────────────
  const handleClinicalReport = async () => {
    if(!results) {
      showNotification('Primero ejecuta el análisis', 'warning');
      return;
    }
    
    showNotification('Generando informe clínico...', 'info');
    
    try {
      const resp = await fetch('http://127.0.0.1:5000/api/clinical_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n_samples: 569, // Puedes calcular esto de tu dataset real
          accuracy: results.accuracy,
          sensitivity: results.metrics.recall,
          specificity: results.metrics.specificity
        })
      });
      const data = await resp.json();
      setClinicalReport(data.report);
      showNotification('Informe clínico generado', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Error al generar informe clínico', 'error');
    }
  };

  // ── Exportaciones ────────────────────────────────────
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Resultados Project Weka', 15, 20);
    doc.setFontSize(14);
    doc.text('Métricas Principales:', 15, 40);
    
    const metr = [
      ['Precisión', `${(results.accuracy*100).toFixed(2)}%`],
      ['Recall', `${(results.metrics.recall*100).toFixed(2)}%`],
      ['F1‑Score', `${(results.metrics.f1*100).toFixed(2)}%`],
      ['ROC AUC', `${(results.metrics.roc*100).toFixed(2)}%`],
    ];
    
    doc.autoTable({ 
      startY: 45, 
      head: [['Métrica', 'Valor']], 
      body: metr, 
      theme: 'grid' 
    });
    
    doc.text('Matriz de Confusión:', 15, doc.autoTable.previous.finalY + 20);
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 25,
      head: [['', 'Pred Pos', 'Pred Neg']],
      body: [
        ['Real Pos', results.confusionMatrix[0][0], results.confusionMatrix[0][1]],
        ['Real Neg', results.confusionMatrix[1][0], results.confusionMatrix[1][1]],
      ],
      theme: 'grid'
    });
    
    doc.save('project-weka-resultados.pdf');
    showNotification('PDF descargado', 'success');
  };

  const exportClinicalPDF = () => {
    if (!clinicalReport) return;
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Informe Clínico - Análisis de Cáncer de Mama', 15, 20);
    doc.setFontSize(12);
    
    const lines = doc.splitTextToSize(clinicalReport, 180);
    doc.text(lines, 15, 40);
    
    doc.save('informe-clinico-cancer-mama.pdf');
    showNotification('Informe clínico exportado a PDF', 'success');
  };

  const exportToCSV = () => {
    let csv = 'Métrica,Valor\n'
      + `Precisión,${(results.accuracy*100).toFixed(2)}%\n`
      + `Recall,${(results.metrics.recall*100).toFixed(2)}%\n`
      + `F1‑Score,${(results.metrics.f1*100).toFixed(2)}%\n`
      + `ROC AUC,${(results.metrics.roc*100).toFixed(2)}%\n\n`
      + 'Matriz de Confusión\n'
      + ',Pred Pos,Pred Neg\n'
      + `Real Pos,${results.confusionMatrix[0][0]},${results.confusionMatrix[0][1]}\n`
      + `Real Neg,${results.confusionMatrix[1][0]},${results.confusionMatrix[1][1]}\n`;
    
    const blob = new Blob([csv], {type: 'text/csv'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'project-weka-resultados.csv';
    link.click();
    showNotification('CSV descargado', 'success');
  };

  const exportToARFF = () => {
    let arff = `% resultados Project Weka\n@RELATION resultados\n\n`
      + '@ATTRIBUTE precision NUMERIC\n@ATTRIBUTE recall NUMERIC\n'
      + '@ATTRIBUTE f1score NUMERIC\n@ATTRIBUTE rocauc NUMERIC\n\n@DATA\n'
      + `${results.accuracy},${results.metrics.recall},${results.metrics.f1},${results.metrics.roc}\n`;
    
    const blob = new Blob([arff], {type: 'text/plain'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'project-weka-resultados.arff';
    link.click();
    showNotification('ARFF descargado', 'success');
  };

  // ── Render ───────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Notificaciones */}
      <div style={styles.notificationsContainer}>
        {notifications.map(n => (
          <div key={n.id} style={{
            ...styles.notification,
            backgroundColor: n.type === 'error' ? '#ffebee'
                            : n.type === 'success' ? '#e8f5e9'
                            : '#e3f2fd',
            borderLeft: `4px solid ${
              n.type === 'error' ? '#f44336'
              : n.type === 'success' ? '#4caf50'
              : '#2196f3'
            }`
          }}>{n.msg}</div>
        ))}
      </div>

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>
          <i className="fas fa-robot" style={styles.headerIcon}></i>
          Project Weka
        </h1>
      </header>

      {/* Panel principal */}
      <div style={styles.mainPanel}>
        {/* Panel de datos */}
        <div style={styles.dataPanel}>
          <h2 style={styles.panelTitle}>
            <i className="fas fa-database" style={styles.panelIcon}></i>
            Cargar Dataset
          </h2>
          {fileInfo && (
            <div style={styles.fileInfo}>
              <div><strong>Archivo:</strong> {fileInfo.name}</div>
              <div><strong>Tamaño:</strong> {fileInfo.size}</div>
              <div><strong>Tipo:</strong> {fileInfo.type}</div>
            </div>
          )}
          <textarea
            style={styles.textarea}
            placeholder="Pega aquí o carga un archivo…"
            value={fileContent}
            onChange={e => setFileContent(e.target.value)}
          />
          <div style={styles.fileButtons}>
            <button 
              onClick={() => fileInputRef.current.click()} 
              style={styles.uploadButton}
            >
              <i className="fas fa-upload" style={styles.buttonIcon}></i>
              Subir Archivo
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{display: 'none'}} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => {
                setFileContent(''); 
                setFileInfo(null); 
                showNotification('Datos limpiados', 'info');
              }} 
              style={styles.clearButton}
            >
              <i className="fas fa-trash" style={styles.buttonIcon}></i>
              Limpiar
            </button>
          </div>
        </div>

        {/* Panel de configuración */}
        <div style={styles.configPanel}>
          <h2 style={styles.panelTitle}>
            <i className="fas fa-sliders-h" style={styles.panelIcon}></i>
            Configuración
          </h2>
          <label style={styles.label}>Algoritmo:</label>
          <select
            value={algorithm}
            onChange={e => setAlgorithm(e.target.value)}
            style={styles.select}
          >
            <option value="decision-tree">Árbol de Decisión (J48)</option>
            <option value="random-forest">Random Forest</option>
            <option value="svm">SVM</option>
            <option value="naive-bayes">Naive Bayes</option>
            <option value="knn">K‑Nearest Neighbors</option>
            <option value="mlp">Multicapas (MLP)</option>
            <option value="logistic-regression">Regresión Logística</option>
          </select>
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            style={{
              ...styles.processButton,
              backgroundColor: isProcessing ? '#9e9e9e' : '#4caf50'
            }}
          >
            {isProcessing
              ? <><i className="fas fa-spinner fa-spin" style={styles.buttonIcon}></i>Procesando…</>
              : <><i className="fas fa-play" style={styles.buttonIcon}></i>Ejecutar</>
            }
          </button>

          {/* Botón de recomendaciones */}
          <button
            onClick={handleRecommend}
            style={{
              ...styles.processButton,
              backgroundColor: '#ff9800',
              marginTop: 10
            }}
          >
            <i className="fas fa-lightbulb" style={styles.buttonIcon}></i>
            Recomendaciones
          </button>

          {/* Botón de informe clínico */}
          <button
            onClick={handleClinicalReport}
            disabled={!results}
            style={{
              ...styles.processButton,
              backgroundColor: '#673ab7',
              marginTop: 10
            }}
          >
            <i className="fas fa-file-medical" style={styles.buttonIcon}></i>
            Informe Clínico
          </button>
        </div>
      </div>

      {/* Resultados */}
      {results && (
        <div style={styles.resultsPanel}>
          <h2 style={styles.panelTitle}>
            <i className="fas fa-chart-bar" style={styles.panelIcon}></i>
            Resultados
          </h2>

          {/* Métricas */}
          <div style={styles.metricsGrid}>
            {[
              {label: 'Precisión', value: results.accuracy},
              {label: 'Recall', value: results.metrics.recall},
              {label: 'F1‑Score', value: results.metrics.f1},
              {label: 'ROC AUC', value: results.metrics.roc},
            ].map(m => (
              <div key={m.label} style={styles.metricCard}>
                <div style={styles.metricLabel}>{m.label}</div>
                <div style={styles.metricValue}>{(m.value*100).toFixed(2)}%</div>
              </div>
            ))}
          </div>

          {/* Gráficos */}
          <div style={styles.chartsContainer}>
            <div style={styles.chart}>
              <h3 style={styles.chartTitle}>Métricas de Rendimiento</h3>
              <Bar 
                data={performanceData} 
                options={{
                  responsive: true,
                  scales: {y: {beginAtZero: true, max: 1}},
                  plugins: {legend: {display: false}}
                }}
              />
            </div>
            <div style={styles.chart}>
              <h3 style={styles.chartTitle}>Matriz de Confusión</h3>
              <Line 
                data={{
                  labels: ['VP','FP','FN','VN'],
                  datasets: [{
                    data: results.confusionMatrix.flat(),
                    borderColor: [
                      'rgba(76,175,80,1)',
                      'rgba(244,67,54,1)',
                      'rgba(244,67,54,1)',
                      'rgba(76,175,80,1)'
                    ],
                    backgroundColor: [
                      'rgba(76,175,80,0.7)',
                      'rgba(244,67,54,0.7)',
                      'rgba(244,67,54,0.7)',
                      'rgba(76,175,80,0.7)'
                    ],
                    borderWidth: 1
                  }]
                }} 
                options={{
                  responsive: true,
                  scales: {y: {beginAtZero: true}},
                  plugins: {legend: {display: false}}
                }}
              />
            </div>
          </div>

          {/* Botones de exportación */}
          <div style={styles.exportButtons}>
            <button onClick={exportToPDF} style={styles.exportButton}>
              <i className="fas fa-file-pdf" style={styles.buttonIcon}></i>PDF
            </button>
            <button onClick={exportToCSV} style={styles.exportButton}>
              <i className="fas fa-file-csv" style={styles.buttonIcon}></i>CSV
            </button>
            <button onClick={exportToARFF} style={styles.exportButton}>
              <i className="fas fa-file-code" style={styles.buttonIcon}></i>ARFF
            </button>
          </div>

          {/* Panel de Recomendaciones */}
          {recs && (
            <div style={styles.recsPanel}>
              <h3 style={styles.panelTitle}>
                <i className="fas fa-comments" style={styles.panelIcon}></i>
                Sugerencias Inteligentes
              </h3>
              <ul style={styles.recsList}>
                {recs.map((r, i) => (
                  <li key={i} style={styles.recItem}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Panel de Informe Clínico */}
          {clinicalReport && (
            <div style={styles.clinicalPanel}>
              <h3 style={styles.panelTitle}>
                <i className="fas fa-user-md" style={styles.panelIcon}></i>
                Informe Clínico
              </h3>
              <div style={styles.clinicalContent}>
                {clinicalReport.split('\n').map((line, i) => (
                  <p key={i} style={styles.clinicalText}>
                    {line}
                  </p>
                ))}
              </div>
              <button 
                onClick={exportClinicalPDF}
                style={{
                  ...styles.exportButton,
                  backgroundColor: '#673ab7',
                  marginTop: 15
                }}
              >
                <i className="fas fa-download" style={styles.buttonIcon}></i>
                Descargar Informe
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        © {new Date().getFullYear()} Felix Linares, Brandon Osorio y Andrés Navas
      </footer>
    </div>
  );
};

// ── Estilos ────────────────────────────────────────────
const styles = {
  container: {
    fontFamily: "'Segoe UI', sans-serif",
    maxWidth: 1400,
    margin: '0 auto',
    padding: 20,
    background: '#f5f7fa',
    minHeight: '100vh'
  },
  notificationsContainer: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 1000,
    maxWidth: 400
  },
  notification: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 4,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    color: '#333'
  },
  header: {
    background: 'linear-gradient(135deg, #3f51b5 0%, #303f9f 100%)',
    color: '#fff',
    padding: 25,
    borderRadius: 8,
    marginBottom: 30,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  headerTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerIcon: {
    marginRight: 15,
    fontSize: 28
  },
  mainPanel: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 25,
    marginBottom: 30
  },
  dataPanel: {
    background: '#fff',
    padding: 25,
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  configPanel: {
    background: '#fff',
    padding: 25,
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  panelTitle: {
    color: '#3f51b5',
    borderBottom: '2px solid #3f51b5',
    paddingBottom: 12,
    margin: 0,
    marginBottom: 20,
    fontSize: 20,
    display: 'flex',
    alignItems: 'center'
  },
  panelIcon: {
    marginRight: 12,
    fontSize: 20
  },
  fileInfo: {
    background: '#f5f5f5',
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.6
  },
  textarea: {
    width: '100%',
    height: 200,
    padding: 15,
    borderRadius: 6,
    border: '1px solid #ddd',
    fontFamily: 'Consolas, monospace',
    fontSize: 13,
    resize: 'vertical',
    marginBottom: 15
  },
  fileButtons: {
    display: 'flex',
    gap: 15
  },
  uploadButton: {
    padding: '12px 20px',
    background: '#3f51b5',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background-color 0.3s'
  },
  clearButton: {
    padding: '12px 20px',
    background: '#f5f7fa',
    border: '1px solid #ddd',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background-color 0.3s'
  },
  buttonIcon: {
    marginRight: 8,
    fontSize: 14
  },
  select: {
    width: '100%',
    padding: 12,
    borderRadius: 6,
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: 14,
    marginBottom: 20
  },
  processButton: {
    width: '100%',
    padding: 15,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background-color 0.3s',
    marginTop: 20
  },
  resultsPanel: {
    background: '#fff',
    padding: 30,
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginTop: 20
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
    marginBottom: 30
  },
  metricCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 20,
    textAlign: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
  },
  metricLabel: {
    color: '#555',
    fontSize: 14,
    marginBottom: 10
  },
  metricValue: {
    color: '#3f51b5',
    fontSize: 28,
    fontWeight: 'bold'
  },
  chartsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 30
  },
  chart: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
  },
  chartTitle: {
    color: '#555',
    marginTop: 0,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16
  },
  exportButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 30
  },
  exportButton: {
    padding: '12px 20px',
    background: '#3f51b5',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background-color 0.3s'
  },
  recsPanel: {
    background: '#fff8e1',
    padding: 20,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginTop: 20
  },
  recsList: {
    listStyle: 'disc',
    paddingLeft: '1.5em',
    color: '#333'
  },
  recItem: {
    marginBottom: '0.5em',
    fontSize: '15px'
  },
  clinicalPanel: {
    background: '#f3e5f5',
    padding: 20,
    borderRadius: 8,
    marginTop: 30,
    borderLeft: '4px solid #9c27b0'
  },
  clinicalContent: {
    background: '#fff',
    padding: 15,
    borderRadius: 4,
    marginTop: 10,
    whiteSpace: 'pre-line',
    lineHeight: 1.6
  },
  clinicalText: {
    margin: '8px 0',
    fontSize: 14
  },
  footer: {
    marginTop: 50,
    textAlign: 'center',
    color: '#777',
    fontSize: 14,
    padding: '20px 0',
    borderTop: '1px solid #eee'
  }
};

export default ProjectWeka;