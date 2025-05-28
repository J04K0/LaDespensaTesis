"use strict";

import { PORT, HOST } from "./config/configEnv.js";
import cors from "cors";
import express, { urlencoded, json } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import indexRoutes from "./routes/index.routes.js";
import { setupDB } from "./config/configDB.js";
import { handleErrorServer } from './utils/resHandlers.js';
import { createRoles, createUsers } from "./config/initialSetup.js";
import http from 'http';
import { Server } from 'socket.io';

// Variable global para el socket.io
export let io;

async function setupServer() {
  try {
    const app = express();
    app.disable("x-powered-by");
    app.use(cors({ credentials: true, origin: true }));
    app.use(urlencoded({ extended: true }));
    app.use(json());
    app.use(cookieParser());
    app.use(morgan("dev"));
    app.use('/api/src/upload', express.static('src/upload')); //Rutas estaticas de imagenes
    app.use("/api", indexRoutes);

    // Crear servidor HTTP
    const server = http.createServer(app);
    
    // Configurar Socket.IO con CORS habilitado
    io = new Server(server, {
      cors: {
        origin: '*', // En producción, cambiar a la URL específica
        methods: ['GET', 'POST']
      }
    });
    
    // Configurar eventos de WebSocket
    io.on('connection', (socket) => {
      // Eliminados los console.log de conexión
      
      socket.on('disconnect', () => {
        // Eliminado el console.log de desconexión
      });
    });

    server.listen(PORT, () => {
      console.log(`=> Servidor corriendo en ${HOST}:${PORT}/api`);
    });
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
}


async function setupAPI() {
  try {
    await setupDB();
    await setupServer();
    await createRoles();
    await createUsers();
  } catch (err) {
    handleErrorServer(res, 500, 'Error al iniciar la API');
  }
}

setupAPI()
  .then(() => console.log("=> API Iniciada exitosamente"))
  .catch((err) => handleErrorServer(res, 500, 'Error al iniciar la API'));