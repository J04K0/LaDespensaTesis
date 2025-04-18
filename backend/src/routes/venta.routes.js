import express from 'express';
import { registrarVenta, obtenerVentas, obtenerVentasPorTicket, deleteTicket, editTicket } from '../controllers/venta.controller.js';

import { isAdmin, isEmpleado, authorizeRoles, isJefe } from '../middlewares/authorization.middleware.js';
import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = express.Router();
router.use(authenticationMiddleware);

router.post('/registrar-venta', authorizeRoles([isEmpleado, isAdmin, isJefe]), registrarVenta);
router.get('/ventas/obtener', authorizeRoles([isEmpleado, isAdmin, isJefe]), obtenerVentas);
router.get("/ventas/tickets", authorizeRoles([isEmpleado, isAdmin, isJefe]), obtenerVentasPorTicket);
router.delete("/ticket/:ticketId", authorizeRoles([isEmpleado, isAdmin, isJefe]), deleteTicket);
router.put("/ticket/:ticketId", authorizeRoles([isEmpleado, isAdmin, isJefe]), editTicket);

export default router;