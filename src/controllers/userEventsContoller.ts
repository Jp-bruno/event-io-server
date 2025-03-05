import { Request, Response } from "express";
import { z } from "zod";
import pool from "../database/database.js";

const userEventsContoller = {
    enrollUser: async (req: Request, res: Response) => {
        try {
            const bodySchema = z.object({
                userId: z.number().min(1),
                eventId: z.number().min(1),
            });

            const { userId, eventId } = bodySchema.parse(req.body);

            await pool.query(`INSERT INTO user_events (user_id, event_id, role) VALUES(? , ?)`, [userId, eventId, "participant"]);

            res.status(201).end();
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    unenrollUser: async (req: Request, res: Response) => {
        try {
            const paramsSchema = z.object({
                userId: z.coerce.number().min(1),
                eventId: z.coerce.number().min(1),
            });

            const { userId, eventId } = paramsSchema.parse(req.params);

            await pool.query(`DELETE FROM user_events WHERE user_id = ? AND event_id = ? `, [userId, eventId]);

            res.status(204).end();
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
};

export default userEventsContoller;
