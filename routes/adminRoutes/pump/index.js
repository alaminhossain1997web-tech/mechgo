const express = require("express");
const controller = require("../../../controllers/adminContoller/pumpController/adminPumpController");

const router = express.Router();
const pumpRouter = express.Router();
pumpRouter.get("/all_pumps", controller.getAll);
pumpRouter.get("/selected_pump/:id", controller.getOne);
pumpRouter.patch("/approve/:id", controller.approve);
pumpRouter.patch("/reject/:id", controller.reject);
router.use("/pump", pumpRouter);

module.exports = router;
