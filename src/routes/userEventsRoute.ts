import { Router } from "express";
import userEventsContoller from "../controllers/userEventsContoller.js";

const userEventsRoute = Router()

userEventsRoute.post("/", (req, res) => userEventsContoller.enrollUser(req, res))
userEventsRoute.get("/", (req, res) => userEventsContoller.getUserEvents(req, res))

export default userEventsRoute;