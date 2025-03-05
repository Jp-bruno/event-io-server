import { query, Request, Response } from "express";
import { z } from "zod";
import pool from "../database/database.js";
import { TUser } from "../ts/types.js";
import { QueryResult, ResultSetHeader } from "mysql2";

const eventController = {
    createEvent: async (req: Request, res: Response) => {
        try {
            const bodySchema = z.object({
                title: z.string().nonempty().max(100).trim(),
                thumbnail: z.string().url().optional(),
                banner: z.string().url().optional(),
                description: z.string().max(1000).optional(),
                resume: z.string().max(100).optional(),
                location: z.string().max(500).optional(),
                date: z.string().optional(),
            });

            const { title, thumbnail, banner, description, resume, location, date } = bodySchema.parse(req.body);

            const [result] = await pool.query(
                `INSERT INTO events (event_title, event_thumbnail, event_banner, event_host_id, event_description, event_resume, event_location, event_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?);`,
                [
                    title,
                    thumbnail ?? null,
                    banner ?? null,
                    (req.user as TUser).id,
                    description ?? null,
                    resume ?? null,
                    location ?? null,
                    date ?? null,
                ]
            );

            await pool.query(
                `INSERT INTO user_events (user_id, event_id, user_role)
                VALUES (? , ? ,?);`,
                [(req.user as TUser).id, (result as ResultSetHeader).insertId, "host"]
            );

            res.status(201).end();
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    updateEvent: async (req: Request, res: Response) => {
        try {
            const bodySchema = z.object({
                id: z.number().min(1),
                title: z.string().nonempty().max(100).trim().optional(),
                thumbnail: z.string().url().optional(),
                banner: z.string().url().optional(),
                description: z.string().max(1000).optional(),
                resume: z.string().max(100).optional(),
                location: z.string().max(500).optional(),
                date: z.string().optional(),
            });

            const parsedBody = bodySchema.parse(req.body);

            let queryString = `UPDATE events SET `;

            const entries = Object.entries(parsedBody);

            const params: (number | string | boolean)[] = [];

            entries.forEach((entry, index) => {
                if (entry[0] === "id") {
                    return;
                }

                queryString += `event_${entry[0]} = ?${index === entries.length - 1 ? " " : ", "}`;
                params.push(entry[1]);
            });

            queryString += `WHERE id = ${entries[0][1]}`;

            await pool.query(queryString, params);

            res.status(200).end();
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    deleteEvent: async (req: Request, res: Response) => {
        try {
            const paramsSchema = z.coerce.number().min(1);

            const parsedParams = paramsSchema.parse(req.params.id);

            await pool.query(`DELETE FROM events WHERE id = ?`, [parsedParams]);

            res.status(204).end();
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    getEvent: async (req: Request, res: Response) => {
        try {
            const paramsSchema = z.string().optional();

            const slug = paramsSchema.parse(req.params.slug);

            if (req.user) {
                const [rows] = await pool.query(
                    `SELECT 
                            id, 
                            event_title AS title, 
                            event_thumbnail AS thumbnail, 
                            event_banner AS banner, 
                            event_host_id AS host_id, 
                            event_description AS description, 
                            event_resume AS resume, 
                            event_slug AS slug, 
                            event_location AS location, 
                            event_date AS date,
                            CASE
                                WHEN user_events.user_id IS NOT NULL THEN TRUE
                                ELSE FALSE
                            END AS is_enrolled
                        FROM events
                        LEFT JOIN user_events
                            ON events.id = user_events.event_id AND user_events.user_id = ?
                        WHERE event_slug = ?`,
                    [(req.user as TUser).id, slug]
                );

                res.status(200).json(rows[0 as keyof QueryResult]);
                return;
            }

            const [rows] = await pool.query(
                `SELECT 
                        id, 
                        event_title AS title, 
                        event_thumbnail AS thumbnail, 
                        event_banner AS banner, 
                        event_host_id AS host_id, 
                        event_description AS description, 
                        event_resume AS resume, 
                        event_slug AS slug, 
                        event_location AS location, 
                        event_date AS date
                    FROM events
                    WHERE event_slug = ?`,
                [slug]
            );

            res.status(200).json(rows[0 as keyof QueryResult]);
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    getEvents: async (req: Request, res: Response) => {
        try {
            const querySchema = z.object({
                limit: z.coerce.number().optional(),
                page: z.coerce.number().optional(),
                query: z.string().optional(),
            });

            const { limit, page, query } = querySchema.parse(req.query);

            // TODO - APPLY PAGINATION

            const params = [];

            let queryString = `
                SELECT 
                    id, 
                    event_title AS title, 
                    event_thumbnail AS thumbnail, 
                    event_banner AS banner, 
                    event_host_id AS host_id, 
                    event_description AS description, 
                    event_resume AS resume, 
                    event_slug AS slug, 
                    event_location AS location, 
                    event_date AS date 
                FROM events 
            `;

            if (query) {
                queryString += `WHERE event_title LIKE ?`;
                params.push(`%${query}%`);
            }

            if (limit) {
                queryString += "LIMIT ?";
                params.push(limit);
            }

            const [rows] = await pool.query(queryString, params);

            res.status(200).json(rows);
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
};

export default eventController;
