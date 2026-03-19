/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Debug from "debug";
import type Property from "../../../classes/Property";
import { DEBUG_INFER_SCHEMA } from "../../../constants";
import { NodeField } from "../NodeField";
import mapNeo4jToGraphQLType from "./map-neo4j-to-graphql-type";

const debug = Debug(DEBUG_INFER_SCHEMA);

export default function createNodeFields(propertyRows: Property[], elementType: string): NodeField[] {
    const out: NodeField[] = [];
    propertyRows.forEach((propertyRow) => {
        if (!propertyRow.types) {
            if (debug.enabled) {
                debug("%s", `No properties on ${elementType}. Skipping generation.`);
            }
            return;
        }
        if (propertyRow.types.length > 1) {
            if (debug.enabled) {
                debug(
                    "%s",
                    `Ambiguous types on ${elementType}.${propertyRow.name}. Fix the inconsistencies for this property to be included`
                );
            }
            return;
        }
        out.push(new NodeField(propertyRow.name, mapNeo4jToGraphQLType(propertyRow.types, propertyRow.mandatory)));
    });
    return out;
}
