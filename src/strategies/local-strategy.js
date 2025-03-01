import passport from "passport";
import { Strategy } from "passport-local";
import pool from "../database/database.ts";
import bcrypt from "bcrypt";

passport.serializeUser((userData, done) => {
    done(null, userData);
});

passport.deserializeUser(async (userData, done) => {
    try {
        const [rows] = await pool.query(`SELECT id, user_name, user_email FROM users WHERE user_email = ?`, [userData.email]);

        const user = rows[0];

        done(null, { name: user.user_name, email: user.user_email, id: user.id });
    } catch (e) {
        done(e, null);
    }
});

export default passport.use(
    new Strategy({ usernameField: "email", passwordField: "password", passReqToCallback: true }, async (req, email, password, done) => {
        try {
            const [rows] = await pool.query(`SELECT id, user_name, user_email, user_password FROM users WHERE user_email = ?`, [email]);

            const user = rows[0];

            if (!user) {
                return done(null, false, { message: "User not found." });
            }

            const match = await bcrypt.compare(password, user.user_password);

            if (!match) {
                return done(null, false, { message: "Wrong password" });
            }

            return done(null, { name: user.user_name, email: user.user_email, id: user.id });
        } catch (e) {
            console.log(e);
            return done(e, false, e);
        }
    })
);
