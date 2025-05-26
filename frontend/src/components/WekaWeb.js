import React, { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Upload as UploadIcon,
  PlayArrow as PlayArrowIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  TableChart as TableIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Registro de componentes Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ProjectWeka = () => {
  // Estados
  const [file, setFile] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [algorithm, setAlgorithm] = useState('decision-tree');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const fileInputRef = useRef();

  // Algoritmos disponibles
  const algorithms = [
    { value: 'decision-tree', label: 'Árbol de Decisión (J48)', color: '#4CAF50' },
    { value: 'random-forest', label: 'Random Forest', color: '#8BC34A' },
    { value: 'svm', label: 'SVM (SMO)', color: '#FFC107' },
    { value: 'knn', label: 'K-Nearest Neighbors (IBk)', color: '#FF9800' },
    { value: 'naive-bayes', label: 'Naive Bayes', color: '#2196F3' },
    { value: 'logistic', label: 'Regresión Logística', color: '#3F51B5' },
    { value: 'mlp', label: 'Multilayer Perceptron', color: '#9C27B0' },
    { value: 'naive-bayes-multi', label: 'Naive Bayes Multinomial', color: '#673AB7' }
  ];

  // Efecto para limpiar resultados al cambiar archivo
  useEffect(() => {
    if (!file) {
      setResults(null);
      setDatasetInfo(null);
    }
  }, [file]);

  // Manejo de archivos
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    // Simulación de lectura de metadatos
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          const columns = lines[0].split(',').length;
          const rows = lines.length - 1; // Asume primera línea es encabezado
          
          setDatasetInfo({
            rows,
            columns,
            features: lines[0].split(',').slice(0, -1),
            target: lines[0].split(',').pop() || 'target'
          });
          
          setSnackbar({
            open: true,
            message: 'Dataset cargado correctamente',
            severity: 'success'
          });
        }
      };
      reader.readAsText(selectedFile);
      setLoading(false);
    }, 1000);
  };

  // Limpiar todo
  const handleClear = () => {
    setFile(null);
    setDatasetInfo(null);
    setResults(null);
    setSnackbar({
      open: true,
      message: 'Datos limpiados',
      severity: 'info'
    });
  };

  // Procesar datos
  const handleProcess = () => {
    if (!file) {
      setSnackbar({
        open: true,
        message: 'Por favor selecciona un archivo primero',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    
    // Simulación de procesamiento ML
    setTimeout(() => {
      const mockResults = {
        accuracy: 0.92 + (Math.random() * 0.05 - 0.025), // Valor entre ~0.89 y 0.95
        metrics: {
          precision: 0.91,
          recall: 0.89,
          f1: 0.90,
          roc: 0.93
        },
        confusionMatrix: [
          [120, 8],  // VP, FP
          [5, 115]   // FN, VN
        ],
        algorithm: algorithms.find(a => a.value === algorithm)?.label
      };

      setResults(mockResults);
      setLoading(false);
      
      setSnackbar({
        open: true,
        message: 'Análisis completado con éxito',
        severity: 'success'
      });
    }, 2500);
  };

  // Exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(33, 150, 243);
    doc.text('Resultados de Weka Universitario', 15, 20);
    
    // Metadatos
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Archivo: ${file.name}`, 15, 35);
    doc.text(`Algoritmo: ${results.algorithm}`, 15, 45);
    
    // Métricas
    autoTable(doc, {
      startY: 60,
      head: [['Métrica', 'Valor']],
      body: [
        ['Precisión', `${(results.accuracy * 100).toFixed(2)}%`],
        ['Recall', `${(results.metrics.recall * 100).toFixed(2)}%`],
        ['F1-Score', `${(results.metrics.f1 * 100).toFixed(2)}%`],
        ['ROC AUC', `${(results.metrics.roc * 100).toFixed(2)}%`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [33, 150, 243] }
    });
    
    // Matriz de confusión
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['', 'Predicción Positiva', 'Predicción Negativa']],
      body: [
        ['Real Positiva', results.confusionMatrix[0][0], results.confusionMatrix[0][1]],
        ['Real Negativa', results.confusionMatrix[1][0], results.confusionMatrix[1][1]]
      ],
      theme: 'grid'
    });
    
    doc.save(`resultados_weka_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Datos para gráficos
  const performanceData = {
    labels: ['Precisión', 'Recall', 'F1-Score', 'ROC AUC'],
    datasets: [{
      label: 'Métricas',
      data: [
        results?.accuracy,
        results?.metrics.recall,
        results?.metrics.f1,
        results?.metrics.roc
      ],
      backgroundColor: [
        'rgba(33, 150, 243, 0.7)',
        'rgba(76, 175, 80, 0.7)',
        'rgba(255, 193, 7, 0.7)',
        'rgba(156, 39, 176, 0.7)'
      ],
      borderColor: [
        'rgba(33, 150, 243, 1)',
        'rgba(76, 175, 80, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(156, 39, 176, 1)'
      ],
      borderWidth: 1
    }]
  };

  const confusionData = {
    labels: ['Verdadero Positivo', 'Falso Positivo', 'Falso Negativo', 'Verdadero Negativo'],
    datasets: [{
      data: results?.confusionMatrix.flat() || [0, 0, 0, 0],
      backgroundColor: [
        'rgba(33, 150, 243, 0.7)',
        'rgba(244, 67, 54, 0.7)',
        'rgba(244, 67, 54, 0.7)',
        'rgba(33, 150, 243, 0.7)'
      ],
      borderColor: [
        'rgba(33, 150, 243, 1)',
        'rgba(244, 67, 54, 1)',
        'rgba(244, 67, 54, 1)',
        'rgba(33, 150, 243, 1)'
      ],
      borderWidth: 1
    }]
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#1e3a8a' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            <Box component="span" sx={{ color: '#93c5fd' }}>WEKA</Box> UNIVERSITARIO
          </Typography>
          <Chip 
            label="v2.0" 
            size="small" 
            sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 'bold' }}
          />
        </Toolbar>
      </AppBar>

      {/* Contenido principal */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          
          {/* Panel 1: Cargar Dataset */}
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    bgcolor: '#3b82f6', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    mr: 1.5
                  }}>
                    1
                  </Box>
                  <Typography variant="h6" component="div">
                    Cargar Dataset
                  </Typography>
                </Box>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.arff"
                  style={{ display: 'none' }}
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current.click()}
                  sx={{ 
                    bgcolor: '#3b82f6',
                    '&:hover': { bgcolor: '#2563eb' },
                    mb: 2
                  }}
                >
                  Seleccionar Archivo
                </Button>

                {file && (
                  <Box sx={{ 
                    bgcolor: '#f8fafc', 
                    p: 2, 
                    borderRadius: 1,
                    mb: 2,
                    border: '1px solid #e2e8f0'
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {file.name}
                    </Typography>
                    <Box sx={{ display: 'flex', mt: 1 }}>
                      <Chip 
                        label={`${datasetInfo?.rows} filas`}
                        size="small"
                        icon={<TableIcon fontSize="small" />}
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={`${datasetInfo?.columns} columnas`}
                        size="small"
                        icon={<TableIcon fontSize="small" />}
                      />
                    </Box>
                    {datasetInfo?.features && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Variables: {datasetInfo.features.join(', ')}...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Formatos soportados: CSV, ARFF
                </Typography>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClear}
                  disabled={!file}
                  sx={{ borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  Limpiar Todo
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Panel 2: Configuración */}
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    bgcolor: '#3b82f6', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    mr: 1.5
                  }}>
                    2
                  </Box>
                  <Typography variant="h6" component="div">
                    Configuración
                  </Typography>
                </Box>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="algorithm-label">Algoritmo</InputLabel>
                  <Select
                    labelId="algorithm-label"
                    value={algorithm}
                    label="Algoritmo"
                    onChange={(e) => setAlgorithm(e.target.value)}
                  >
                    {algorithms.map((algo) => (
                      <MenuItem 
                        key={algo.value} 
                        value={algo.value}
                        sx={{ color: algo.color }}
                      >
                        {algo.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {algorithm === 'decision-tree' && (
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, mb: 3, border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Opciones del Árbol
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <InfoIcon color="info" sx={{ fontSize: 16, mr: 1 }} />
                      <Typography variant="caption">
                        Podado automático habilitado
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon color="info" sx={{ fontSize: 16, mr: 1 }} />
                      <Typography variant="caption">
                        Profundidad máxima: 5 niveles
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                  onClick={handleProcess}
                  disabled={!file || loading}
                  sx={{ 
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' },
                    height: 48,
                    fontSize: '1rem'
                  }}
                >
                  {loading ? 'PROCESANDO...' : 'EJECUTAR ANÁLISIS'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Panel 3: Resultados */}
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    bgcolor: '#3b82f6', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    mr: 1.5
                  }}>
                    3
                  </Box>
                  <Typography variant="h6" component="div">
                    Resultados
                  </Typography>
                </Box>

                {results ? (
                  <>
                    <Box sx={{ 
                      bgcolor: '#f0fdf4', 
                      p: 3, 
                      borderRadius: 1,
                      mb: 3,
                      border: '1px solid #bbf7d0',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Precisión del Modelo
                      </Typography>
                      <Typography variant="h3" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                        {(results.accuracy * 100).toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Algoritmo: {results.algorithm}
                      </Typography>
                    </Box>

                    <Box sx={{ height: 300, mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Métricas de Rendimiento
                      </Typography>
                      <Bar
                        key={`bar-${Date.now()}`}
                        data={performanceData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 1,
                              ticks: {
                                callback: (value) => `${(value * 100).toFixed(0)}%`
                              }
                            }
                          },
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.dataset.label}: ${(context.raw * 100).toFixed(2)}%`
                              }
                            }
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ height: 300, mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Matriz de Confusión
                      </Typography>
                      <Pie
                        key={`pie-${Date.now()}`}
                        data={confusionData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'right' },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.label}: ${context.raw}`
                              }
                            }
                          }
                        }}
                      />
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={exportToPDF}
                      sx={{ 
                        bgcolor: '#ef4444',
                        '&:hover': { bgcolor: '#dc2626' }
                      }}
                    >
                      Exportar a PDF
                    </Button>
                  </>
                ) : (
                  <Box sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center',
                    p: 4
                  }}>
                    <Box sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: '#f1f5f9', 
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2
                    }}>
                      <InfoIcon color="disabled" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      {file ? 'Ejecuta el análisis para ver los resultados' : 'Carga un dataset y selecciona un algoritmo'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectWeka;