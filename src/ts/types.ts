import session from "express-session";

export interface TUser extends Express.User {
    name: string;
    email: string;
    id: number;
}

export type UserType = {
    id: number;
    user_name: string;
    user_email: string;
    user_image: string;
    user_password: string;
};


