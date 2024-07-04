import {Router} from 'express';
import { getDeudores,getDeudorById,updateDeudor,deleteDeudor,addDeudor } from '../controllers/deudores.controller.js';
const router = Router();

// Define tus rutas aquí
// Ejemplo de ruta de deudores
router.get('/',getDeudores);

router.get('/:id', getDeudorById);

router.put('/:id', updateDeudor);

router.delete('/:id', deleteDeudor);

router.post('/agregar', addDeudor);

export default router;