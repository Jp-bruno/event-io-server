import express, { CookieOptions } from "express";
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
const Mysqlstore = new Store({ clearExpired: true }, pool);

const cookieSettings: CookieOptions =
    process.env.NODE_ENV === "production"
        ? {
              sameSite: "none", //as the server doesn't have the same domain as the client
              secure: true,
              maxAge: 3600000 * 24, //one day
              httpOnly: true,
              domain: process.env.PROD_ORIGIN,
          }
        : {
              sameSite: "strict",
              secure: false,
              maxAge: 3600000 * 24,
              httpOnly: true,
          };

app.use(
    session({
        secret: process.env.COOKIE_SECRET as string,
        saveUninitialized: false,
        resave: true,
        name: "c.id",
        cookie: cookieSettings,
        store: Mysqlstore,
    })
);

console.log({ cookieSettings });
console.log(process.env.NODE_ENV);
console.log(process.env.PROD_ORIGIN);

app.use(cors({ origin: process.env.NODE_ENV === "development" ? process.env.DEV_ORIGIN : process.env.PROD_ORIGIN, credentials: true }));
app.use(helmet());
app.use(express.json());

app.use(passport.session());
app.use(passport.initialize());

app.use("/user", userRoute);
app.use("/auth", authRouter);
app.use("/event", eventRoute);
app.use("/user_events", userEventsRoute);

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
