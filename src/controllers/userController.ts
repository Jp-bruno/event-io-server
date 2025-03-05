import { Request, Response } from "express";
import { z } from "zod";
import pool from "../database/database.js";
import bcrypt from "bcrypt";
import { QueryResult } from "mysql2";
import { TUser, UserType } from "../ts/types.js";

const userController = {
    createUser: async (req: Request, res: Response) => {
        try {
            const bodySchema = z.object({
                name: z.string().max(100).nonempty().trim(),
                email: z.string().email().nonempty().trim(),
                image: z.string().url().optional(),
                password: z.string().min(8).max(50),
            });

            const parsedBody = bodySchema.parse(req.body);

            const salt = await bcrypt.genSalt(10);

            const hash = await bcrypt.hash(parsedBody.password, salt);

            await pool.query(`INSERT INTO users (user_name, user_email, user_image, user_password) VALUES (?, ?, ?, ?)`, [
                parsedBody.name,
                parsedBody.email,
                parsedBody.image ?? null,
                hash,
            ]);

            res.status(200).json({ user: { name: parsedBody.name, email: parsedBody.email, image: parsedBody.image } });
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    getUser: async (req: Request, res: Response) => {
        try {
            const [rows] = await pool.query(`SELECT user_name as name, user_email as email, user_image as image FROM users WHERE id = ?`, [
                //@ts-ignore
                req.user.id,
            ]);

            res.status(200).json(rows[0 as keyof QueryResult]);
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    updateUser: async (req: Request, res: Response) => {
        try {
            const bodySchema = z.object({
                name: z.string().nonempty().max(100).trim(),
                email: z.string().nonempty().max(100).trim().email(),
                image: z.string().max(255).trim().url().optional(),
            });

            const parsedBody = bodySchema.parse(req.body);

            if (parsedBody.image) {
                await pool.query(`UPDATE users SET user_image = ? WHERE id = ?`, [parsedBody.image, (req.user as TUser).id]);

                res.status(200).end();

                return;
            }

            await pool.query(`UPDATE users SET user_name = ?, user_email = ? WHERE id = ?`, [
                parsedBody.name,
                parsedBody.email,
                (req.user as TUser).id,
            ]);

            res.status(200).end();
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    deleteUser: async (req: Request, res: Response) => {
        try {
            const paramsSchema = z.coerce.number().min(1);

            const parsedParams = paramsSchema.parse(req.params.id);

            const [rows] = await pool.query(`SELECT user_name, user_email, id FROM users WHERE id = ?`, [parsedParams]);

            const user: UserType = rows[0 as keyof QueryResult];

            const userFromSession = req.user as TUser;

            if (user.user_name !== userFromSession.name || user.user_email !== userFromSession.email || user.id !== Number(userFromSession.id)) {
                res.status(403).end();
                return;
            }

            await pool.query(`DELETE FROM users WHERE id = ?`, [parsedParams]);

            res.status(204).end();
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
    pw: async (req, res) => {
        try {
            console.log("hi")
            const [rows] = await pool.query("SELECT user_password, id FROM users");

            rows.forEach(async (user) => {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash("hashedpassword" + user.id, salt);

                console.log(hash);

                await pool.query("UPDATE users SET user_password = ? WHERE id = ?", [hash, user.id]);
            });
            res.status(200);
        } catch (e) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
};

export default userController;
