import type { Driver } from "neo4j-driver";
import type { OGM } from "@neo4j/graphql-ogm";

export type Context = {
    ogm: OGM;
    adminOverride?: boolean;
    driver: Driver;
};
