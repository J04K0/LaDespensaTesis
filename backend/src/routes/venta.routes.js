import express from 'express';
import { registrarVenta, obtenerVentas, obtenerVentasPorTicket, deleteTicket, editTicket, obtenerVentasPropias, obtenerVentasAnuladas } from '../controllers/venta.controller.js';

import { isAdmin, isEmpleado, authorizeRoles, isJefe } from '../middlewares/authorization.middleware.js';
import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = express.Router();
router.use(authenticationMiddleware);

router.post('/registrar-venta', authorizeRoles([isEmpleado, isAdmin, isJefe]), registrarVenta);
router.get('/ventas/obtener', authorizeRoles([isEmpleado, isAdmin, isJefe]), obtenerVentas);
// Nuevo endpoint para que empleados obtengan sus propias ventas
router.get("/ventas/mis-ventas", authorizeRoles([isEmpleado, isAdmin, isJefe]), obtenerVentasPropias);
// PERMITIR que empleados accedan a obtenerVentasPorTicket para reportes de cierre
router.get("/ventas/tickets", authorizeRoles([isEmpleado, isAdmin, isJefe]), obtenerVentasPorTicket);
// Nueva ruta para consultar historial de ventas anuladas (solo admin y jefe)
router.get("/ventas/anuladas", authorizeRoles([isAdmin, isJefe]), obtenerVentasAnuladas);
// MANTENER restricciones para edición y eliminación solo admin/jefe
router.delete("/ticket/:ticketId", authorizeRoles([isAdmin, isJefe]), deleteTicket);
router.put("/ticket/:ticketId", authorizeRoles([isAdmin, isJefe]), editTicket);

export default router;