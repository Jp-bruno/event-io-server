import mysql from "mysql2";

const pool = mysql
    .createPool(
        process.env.NODE_ENV === "production"
            ? {
                  host: process.env.DB_HOST,
                  user: process.env.DB_USER,
                  password: process.env.DB_PW,
                  database: process.env.DB_NAME,
              }
            : {
                  host: process.env.DB_HOST_DEV,
                  user: process.env.DB_USER_DEV,
                  password: process.env.DB_PW_DEV,
                  database: process.env.DB_NAME_DEV,
              }
    )
    .promise();

export default pool;
