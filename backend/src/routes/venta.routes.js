import express from 'express';
import { registrarVenta, obtenerVentas, obtenerVentasPorTicket, deleteTicket, editTicket } from '../controllers/venta.controller.js';

import { isAdmin, isEmpleado, authorizeRoles, isJefe } from '../middlewares/authorization.middleware.js';
import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = express.Router();
router.use(authenticationMiddleware);

router.post('/registrar-venta', authorizeRoles([isEmpleado, isAdmin, isJefe]), registrarVenta);
router.get('/ventas/obtener', authorizeRoles([isEmpleado, isAdmin, isJefe]), obtenerVentas);
// Restringir historial de ventas solo para admin y jefe
router.get("/ventas/tickets", authorizeRoles([isAdmin, isJefe]), obtenerVentasPorTicket);
router.delete("/ticket/:ticketId", authorizeRoles([isAdmin, isJefe]), deleteTicket);
router.put("/ticket/:ticketId", authorizeRoles([isAdmin, isJefe]), editTicket);

export default router;