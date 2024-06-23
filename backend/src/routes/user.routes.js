import express from 'express';
const router = express.Router();

// Define tus rutas aquí
// Ejemplo de ruta de usuario
router.get('/profile', (req, res) => {
  // Lógica para obtener perfil de usuario
  res.send('User profile');
});

export default router;
