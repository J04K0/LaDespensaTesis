"use strict";
// Importa el módulo 'mongoose' para crear la conexión a la base de datos
import mongoose from "mongoose";
// Agregamos la configuración de las variables de entorno
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual usando import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el archivo .env desde src/config
dotenv.config({ path: path.resolve(__dirname, '.env') });
import { handleError } from "../utils/errorHandler.js";

/**
 * Establece la conexión con la base de datos.
 * @async
 * @function setupDB
 * @throws {Error} Si no se puede conectar a la base de datos.
 * @returns {Promise<void>} Una promesa que se resuelve cuando se establece la conexión con la base de datos.
 */

async function setupDB() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("=> Conectado a la base de datos");
  } catch (err) {
    handleError(err, "/configDB.js -> setupDB");
    process.exit(1); // Salir del proceso si no se puede conectar a la base de datos
  }
}

export { setupDB };
