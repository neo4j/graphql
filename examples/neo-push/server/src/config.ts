import * as dotenv from "dotenv";

dotenv.config();

export const HTTP_PORT = Number(process.env.HTTP_PORT);
export const NODE_ENV = process.env.NODE_ENV as string;
export const NEO_WAIT = Number(process.env.NEO_WAIT);
export const NEO_USER: string = process.env.NEO_USER as string;
export const NEO_PASSWORD: string = process.env.NEO_PASSWORD as string;
export const NEO_URL: string = process.env.NEO_URL as string;
export const JWT_SECRET: string = process.env.JWT_SECRET as string;
