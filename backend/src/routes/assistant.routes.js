import { Router } from 'express';
import { processQuery } from '../controllers/assistant.controller.js';
import authenticationMiddleware from '../middlewares/authentication.middleware.js';
import { authorizeRoles, isAdmin, isJefe, isEmpleado } from '../middlewares/authorization.middleware.js';

const router = Router();

router.post('/query', 
  [authenticationMiddleware, authorizeRoles([isEmpleado, isAdmin, isJefe])], 
  processQuery
);

export default router;