import { Driver } from "neo4j-driver";
import { OGM } from "../../../../packages/ogm/src";

export type Context = {
    ogm: OGM;
    adminOverride?: boolean;
    driver: Driver;
};
