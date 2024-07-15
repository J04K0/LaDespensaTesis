"use strict";

import { Router } from "express";
import { 
    createUser, 
    getUsers, 
    getUserById, 
    updateUser, 
    deleteUser
} from "../controllers/user.controller.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticationMiddleware);

router.post("/", isAdmin, createUser);
router.get("/", isAdmin, getUsers);
router.get("/:id", getUserById);
router.put("/:id", isAdmin, updateUser);
router.delete("/:id", isAdmin, deleteUser);

export default router;