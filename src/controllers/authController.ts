import { Request, Response } from "express";

const authController = {
    status: async (req: Request, res: Response) => {
        try {
            if (!req.session) {
                res.sendStatus(401);
                return;
            }

            if (req.user) {
                res.status(200).json(req.user);
                return;
            }

            res.sendStatus(401);
        } catch (e: any) {
            console.log(e);
            res.status(500).json({ message: e.message });
        }
    },
};

export default authController;
