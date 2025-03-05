import { Router } from "express";
import passport from "passport";
import authController from "../controllers/authController.js";
import { Request, Response } from "express";

const authRouter = Router();

authRouter.post("/", (req, res, next) => {
    passport.authenticate("local", ((err, user, info) => {
        console.log({ err, user, info });
        if (err) {
            return res.status(500).json({ message: err });
        }
        if (!user) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ message: "Login failed" });
            }
            return res.json({ message: "Login successful", user });
        });
    }) as passport.AuthenticateCallback)(req, res, next);
});
authRouter.post("/logout", (req, res, next) => {
    req.sessionStore.destroy(req.session.id);

    req.logOut((err) => {
        if (err) {
            console.log({ errReqLogout: err });
        }

        req.session.destroy((err) => {
            if (err) {
                console.log({ errSessionDestroy: err });
                return res.status(500).json({ message: "Logout failed" });
            }
            res.clearCookie("c.id");
            res.json({ message: "Logout successful" });
        });
    });
});
authRouter.get("/status", (req, res) => authController.status(req, res));

export default authRouter;
