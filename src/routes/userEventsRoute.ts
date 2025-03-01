import { Router } from "express";
import userEventsContoller from "../controllers/userEventsContoller.js";

const userEventsRoute = Router()

userEventsRoute.post("/", (req, res) => userEventsContoller.enrollUser(req, res))
userEventsRoute.delete("/:userId/:eventId", (req, res) => userEventsContoller.cancelEnrollment(req, res))

export default userEventsRoute;