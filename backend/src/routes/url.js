import express from 'express';
import { checkCache } from '../middlewares/checkCache.js';
const router = express.Router();
import { handleUrls } from '../controllers/url.controller.js';
//import { validate } from "../middlewares/validator.middleware.js";

router.post('/',checkCache,handleUrls);

export default router;