"use strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Crea el esquema de datos de 'User'
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    rut: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
  },
  {
    versionKey: false,
  },
);

// Encripta la contraseña del usuario
userSchema.statics.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compara la contraseña del usuario con la contraseña encriptada
userSchema.statics.comparePassword = async (password, receivedPassword) => {
  return await bcrypt.compare(password, receivedPassword);
};

// Crea el modelo de datos 'User' a partir del esquema de datos 'userSchema'
const User = mongoose.model("User", userSchema);

//Exporta el modelo 'User' para poder ser utilizado en otras partes de la aplicación
export default User;
