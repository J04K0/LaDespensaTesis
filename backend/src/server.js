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

// Función para configurar el servidor Express y Socket.IO
async function setupServer() {
  try {
    const app = express();
    app.disable("x-powered-by");
    
    // Configuración de CORS más específica para Socket.IO
    app.use(cors({ 
      credentials: true, 
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    app.use(urlencoded({ extended: true }));
    app.use(json());
    app.use(cookieParser());
    app.use(morgan("dev"));
    app.use('/api/src/upload', express.static('src/upload')); //Rutas estaticas de imagenes
    app.use("/api", indexRoutes);

    // Crear servidor HTTP
    const server = http.createServer(app);
    
    // Configurar Socket.IO con CORS más específico
    io = new Server(server, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      allowEIO3: true // Compatibilidad con versiones anteriores
    });
    
    // Configurar eventos de WebSocket
    io.on('connection', (socket) => {
      socket.on('disconnect', () => {
      });
      
      socket.on('error', (error) => {
        console.error('Error en socket:', error);
      });
    });

    server.listen(PORT, HOST, () => {
    });
    
    return server;
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
    throw err;
  }
}

async function setupAPI() {
  try {
    await setupDB();
    await setupServer();
    await createRoles();
    await createUsers();
  } catch (err) {
    console.error('Error al iniciar la API:', err);
    process.exit(1);
  }
}

setupAPI()
  .then(() => console.log("=> API Iniciada exitosamente"))
  .catch((err) => {
    console.error('Error fatal al iniciar la API:', err);
    process.exit(1);
  });