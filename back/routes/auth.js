import express from "express";
import * as auth from './../controllers/auth.js';

const router = express.Router()

router.post('/pre-register', auth.preRegister)

export default router