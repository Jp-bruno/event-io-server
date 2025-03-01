import { Router } from "express";
import eventController from "../controllers/eventController.js";

const eventRoute = Router();

eventRoute.post("/", (req, res) => eventController.createEvent(req, res));
eventRoute.get("/:slug", (req, res) => eventController.getEvent(req, res));
eventRoute.get("/", (req, res) => eventController.getEvents(req, res));
eventRoute.put("/", (req, res) => eventController.updateEvent(req, res));
eventRoute.delete("/:id", (req, res) => eventController.deleteEvent(req, res));

export default eventRoute;