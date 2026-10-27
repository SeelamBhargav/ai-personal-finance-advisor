"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accounts_1 = require("../controllers/accounts");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Apply auth middleware to all account endpoints
router.use(auth_1.authenticate);
router.get("/", accounts_1.getAccounts);
router.post("/", accounts_1.createAccount);
router.put("/:id", accounts_1.updateAccount);
router.delete("/:id", accounts_1.deleteAccount);
exports.default = router;
