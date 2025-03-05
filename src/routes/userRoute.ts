import { Router } from "express";
import userController from "../controllers/userController.js";

const userRoute = Router();

userRoute.post("/", (req, res) => userController.createUser(req, res));
userRoute.get("/", (req, res) => userController.getUser(req, res));
userRoute.put("/", (req, res) => userController.updateUser(req, res));
userRoute.delete("/:id", (req, res) => userController.deleteUser(req, res));

export default userRoute;