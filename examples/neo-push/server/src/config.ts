import * as dotenv from "dotenv";

dotenv.config();

export const HTTP_PORT = Number(process.env.HTTP_PORT || 5000);
export const NODE_ENV = process.env.NODE_ENV as string;
export const NEO_USER: string = (process.env.NEO_USER || "admin") as string;
export const NEO_PASSWORD: string = (process.env.NEO_PASSWORD || "password") as string;
export const NEO_URL: string = (process.env.NEO_URL || "neo4j://localhost:7687/neo4j") as string;
export const NEO4J_GRAPHQL_JWT_SECRET: string = (process.env.NEO4J_GRAPHQL_JWT_SECRET || "secret") as string;
