import { Request, Response } from "express";
import { z } from "zod";
import pool from "../database/database.js";
import { TUser } from "../ts/types.js";

const userEventsContoller = {
    enrollUser: async (req: Request, res: Response) => {
        try {
            const bodySchema = z.object({
                userId: z.number().min(1),
                eventId: z.number().min(1),
            });

            const { userId, eventId } = bodySchema.parse(req.body);

            await pool.query(`INSERT INTO user_events (user_id, event_id, user_role) VALUES(?, ?, ?)`, [userId, eventId, "participant"]);

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
    getUserEvents: async (req: Request, res: Response) => {
        try {
            const querySchema = z.object({
                limit: z.coerce.number().optional(),
                offset: z.coerce.number().optional(),
                query: z.string().optional(),
            });

            const { limit, offset, query } = querySchema.parse(req.query);

            const params: (string | number)[] = [(req.user as TUser).id];

            let queryString = `
                SELECT 
                    events.id, 
                    event_title AS title, 
                    event_thumbnail AS thumbnail, 
                    event_banner AS banner, 
                    event_host_id AS host_id, 
                    event_description AS description, 
                    event_resume AS resume, 
                    event_slug AS slug, 
                    event_location AS location, 
                    event_date AS date,
                    user_events.user_role as role
                FROM events 
                JOIN user_events 
                ON user_events.event_id = events.id 
                WHERE user_events.user_id = ?
            `;

            if (query) {
                queryString += `AND event_title LIKE ?`;
                params.push(`%${query}%`);
            }

            if (limit) {
                queryString += "LIMIT ? ";
                params.push(limit);
            }

            if (offset) {
                queryString += "OFFSET ?";
                params.push(offset);
            }

            const [rows] = await pool.query(queryString, params);

            res.status(200).json(rows);
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
};

export default userEventsContoller;
