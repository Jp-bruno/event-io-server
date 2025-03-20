import { query, Request, Response } from "express";
import { z } from "zod";
import pool from "../database/database.js";
import { TUser, UserType } from "../ts/types.js";
import { QueryResult, ResultSetHeader } from "mysql2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "../lib/r2.js";
import slug from "slug";

const eventController = {
    createEvent: async (req: Request, res: Response) => {
        try {
            const bodySchema = z.object({
                title: z.string().nonempty().max(100).trim(),
                thumbnail: z
                    .object({
                        name: z.string().max(255).trim(),
                        mimetype: z.string().max(20).trim(),
                    })
                    .optional(),
                banner: z
                    .object({
                        name: z.string().max(255).trim(),
                        mimetype: z.string().max(20).trim(),
                    })
                    .optional(),
                description: z.string().max(1000).optional(),
                resume: z.string().max(100).optional(),
                location: z.string().max(500).optional(),
                date: z.string().optional(),
            });

            const { title, thumbnail, banner, description, resume, location, date } = bodySchema.parse(req.body);

            const fileNameTimeStamp = Date.now();

            let thumbnailSignedUrl = thumbnail
                ? await getSignedUrl(
                      r2,
                      new PutObjectCommand({
                          Bucket: process.env.R2_BUCKET_NAME,
                          Key: `${thumbnail.name}_${(req.user as TUser).id}_${fileNameTimeStamp}}`,
                          ContentType: thumbnail.mimetype,
                      }),
                      { expiresIn: 30 }
                  )
                : null;

            let bannerSignedUrl = banner
                ? await getSignedUrl(
                      r2,
                      new PutObjectCommand({
                          Bucket: process.env.R2_BUCKET_NAME,
                          Key: `${banner.name}_${(req.user as TUser).id}_${fileNameTimeStamp}}`,
                          ContentType: banner.mimetype,
                      }),
                      { expiresIn: 30 }
                  )
                : null;

            const [result] = await pool.query(
                `INSERT INTO events (event_title, event_thumbnail, event_banner, event_host_id, event_description, event_resume, event_location, event_date, event_slug)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                    title,
                    thumbnail ? `${process.env.R2_PUBLIC_ENDPOINT}/${thumbnail.name}` : null,
                    banner ? `${process.env.R2_PUBLIC_ENDPOINT}/${banner.name}` : null,
                    (req.user as TUser).id,
                    description ?? null,
                    resume ?? null,
                    location ?? null,
                    date ? date : null,
                    slug(title, "-"),
                ]
            );

            await pool.query(
                `INSERT INTO user_events (user_id, event_id, user_role)
                VALUES (? , ? ,?);`,
                [(req.user as TUser).id, (result as ResultSetHeader).insertId, "host"]
            );

            if (bannerSignedUrl && thumbnailSignedUrl) {
                res.status(201).json({ bannerSignedUrl, thumbnailSignedUrl });
                return;
            }

            if (bannerSignedUrl) {
                res.status(201).json({ bannerSignedUrl });
                return;
            }

            if (thumbnailSignedUrl) {
                res.status(201).json({ thumbnailSignedUrl });
                return;
            }

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
                title: z.string().nonempty().max(100).trim(),
                thumbnail: z
                    .object({
                        name: z.string().max(255).trim(),
                        mimetype: z.string().max(20).trim(),
                    })
                    .optional()
                    .nullable(),
                banner: z
                    .object({
                        name: z.string().max(255).trim(),
                        mimetype: z.string().max(20).trim(),
                    })
                    .optional()
                    .nullable(),
                description: z.string().max(1000).optional().nullable(),
                resume: z.string().max(100).optional().nullable(),
                location: z.string().max(500).optional().nullable(),
                date: z.string().optional().nullable(),
            });

            const parsedBody = bodySchema.parse(req.body);

            let queryString = `UPDATE events SET `;

            const entries = Object.entries(parsedBody);

            const params: (number | string | boolean | null | { name: string; mimetype: string })[] = [];

            const fileNameTimeStamp = Date.now();

            let newSlug = slug(parsedBody.title, "-");

            entries.forEach((entry, index) => {
                if (entry[0] === "id") {
                    return;
                }

                if (entry[0] === "thumbnail" || entry[0] === "banner") {
                    queryString += `event_${entry[0]} = ?${index === entries.length - 1 ? " " : ", "}`;
                    params.push(
                        `${process.env.R2_PUBLIC_ENDPOINT}/${(entry[1] as { name: string; mimetype: string }).name}_${
                            (req.user as TUser).id
                        }_${fileNameTimeStamp}`
                    );
                    return;
                }

                if (entry[0] === "title") {
                    queryString += `event_slug = ?, `;
                    params.push(newSlug);
                }

                queryString += `event_${entry[0]} = ?${index === entries.length - 1 ? " " : ", "}`;
                params.push(entry[1] ? entry[1] : null);
            });

            queryString += `WHERE id = ?`;

            params.push(entries[0][1]);

            await pool.query(queryString, params);

            let thumbnailSignedUrl = parsedBody.thumbnail
                ? await getSignedUrl(
                      r2,
                      new PutObjectCommand({
                          Bucket: process.env.R2_BUCKET_NAME,
                          Key: `${parsedBody.thumbnail.name}_${(req.user as TUser).id}_${fileNameTimeStamp}`,
                          ContentType: parsedBody.thumbnail.mimetype,
                      }),
                      { expiresIn: 30 }
                  )
                : null;

            let bannerSignedUrl = parsedBody.banner
                ? await getSignedUrl(
                      r2,
                      new PutObjectCommand({
                          Bucket: process.env.R2_BUCKET_NAME,
                          Key: `${parsedBody.banner.name}_${(req.user as TUser).id}_${fileNameTimeStamp}`,
                          ContentType: parsedBody.banner.mimetype,
                      }),
                      { expiresIn: 30 }
                  )
                : null;

            if (bannerSignedUrl && thumbnailSignedUrl) {
                res.status(200).json({ bannerSignedUrl, thumbnailSignedUrl, slug: newSlug });
                return;
            }

            if (bannerSignedUrl) {
                res.status(200).json({ bannerSignedUrl, slug: newSlug });
                return;
            }

            if (thumbnailSignedUrl) {
                res.status(200).json({ thumbnailSignedUrl, slug: newSlug });
                return;
            }

            res.status(200).json({ slug: newSlug });
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    deleteEvent: async (req: Request, res: Response) => {
        try {
            const paramsSchema = z.coerce.number().min(1);

            const parsedParams = paramsSchema.parse(req.params.id);

            const userFromSession = req.user as TUser;

            console.log({ userFromSession });

            const [rows] = await pool.query(`SELECT user_name, user_email, id FROM users WHERE id = ?`, [userFromSession.id]);

            const user: UserType = rows[0 as keyof QueryResult];

            if (user.id !== userFromSession.id) {
                res.status(403).end();
                return;
            }

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
                offset: z.coerce.number().optional(),
                query: z.string().optional(),
            });

            const { limit, offset, query } = querySchema.parse(req.query);

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
                queryString += "LIMIT ? ";
                params.push(limit);
            }

            if (offset) {
                queryString += "OFFSET ?";
                params.push(offset)
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
