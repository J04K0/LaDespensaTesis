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

async function setupServer() {
  try {
    const server = express();
    server.disable("x-powered-by");
    server.use(cors({ credentials: true, origin: true }));
    server.use(urlencoded({ extended: true }));
    server.use(json());
    server.use(cookieParser());
    server.use(morgan("dev"));
    server.use('/api/src/upload', express.static('src/upload')); //Rutas estaticas de imagenes
    server.use("/api", indexRoutes);

    server.listen(PORT, () => {
      console.log(`=> Servidor corriendo en ${HOST}:4000/api`);
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al iniciar el servidor');
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