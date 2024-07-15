"use strict";

import { Schema, model } from "mongoose";
import ROLES from "../constants/roles.constants.js";

const roleSchema = new Schema(
  {
    name: {
      type: String,
      enum: ROLES,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

const Role = model("Role", roleSchema);
export default Role;
