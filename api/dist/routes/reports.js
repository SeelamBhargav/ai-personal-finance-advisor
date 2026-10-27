"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_1 = require("../controllers/reports");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Apply auth middleware to all report endpoints
router.use(auth_1.authenticate);
router.get("/generate", reports_1.generateReport);
exports.default = router;
