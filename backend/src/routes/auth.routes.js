"use strict";

import { Router } from "express";
import {login, logout, refresh} from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/refresh", refresh);

export default router;
