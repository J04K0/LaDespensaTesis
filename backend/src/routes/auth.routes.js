import express from 'express';
const router = express.Router();

// Define tus rutas aquí
// Ejemplo de ruta de autenticación
router.post('/login', (req, res) => {
  // Lógica de autenticación
  res.send('Login');
});

export default router;
