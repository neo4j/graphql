import { Driver } from "neo4j-driver";
import { OGM } from "@neo4j/graphql-ogm";

export type Context = {
    ogm: OGM;
    adminOverride?: boolean;
    driver: Driver;
};
