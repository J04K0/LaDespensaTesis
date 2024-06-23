import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual usando import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el archivo .env desde src/config
dotenv.config({ path: path.resolve(__dirname, 'src/config/.env') });

const dbURI = process.env.DB_URL;

console.log('DB_URL:', dbURI);  // Esto debería imprimir la URI de conexión

const testDBConnection = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    mongoose.connection.close().then(() => {
      console.log('MongoDB connection closed.');
    }).catch((err) => {
      console.error('Error closing MongoDB connection:', err.message);
    });
  }
};

testDBConnection();
