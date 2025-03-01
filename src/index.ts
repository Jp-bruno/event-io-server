import express from "express";
import cors from "cors";
import helmet from "helmet";
import userRoute from "./routes/userRoute.js";
import passport from "passport";
import "./strategies/local-strategy.js";
import authRouter from "./routes/authRoute.js";
import session from "express-session";
import MySQLStore from "express-mysql-session";
import pool from "./database/database.js";
import eventRoute from "./routes/eventRoute.js";
import userEventsRoute from "./routes/userEventsRoute.js";

const app = express();

const Store = MySQLStore(session);

/* @ts-ignore */
const Mysqlstore = new Store({}, pool);

app.use(
    session({
        secret: process.env.COOKIE_SECRET as string,
        saveUninitialized: false,
        resave: true,
        name: "c.id",
        cookie: {
            maxAge: 3600000 * 24, //um dia
            httpOnly: true,
        },
        store: Mysqlstore,
    })
);

app.use(cors({ origin: "http://localhost:3001", credentials: true }));
app.use(helmet());
app.use(express.json());

app.use(passport.session());
app.use(passport.initialize());

app.use("/user", userRoute);
app.use("/auth", authRouter);
app.use("/event", eventRoute);
app.use("/user_events", userEventsRoute);

app.listen(4000, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
