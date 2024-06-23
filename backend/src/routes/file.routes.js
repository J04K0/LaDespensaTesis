import express from 'express';
const router = express.Router();

// Define tus rutas aquí
// Ejemplo de ruta para manejar archivos
router.post('/upload', (req, res) => {
  // Lógica para manejar la subida de archivos
  res.send('File uploaded');
});

export default router;
