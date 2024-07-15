"use strict";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleErrorServer } from "../utils/resHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function setupDB() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("=> Conectado a la base de datos");
  } catch (err) {
    handleErrorServer(res, 500, 'Error al conectar a la base');
    process.exit(1); // Salir del proceso si no se puede conectar a la base de datos
  }
}

export { setupDB };
