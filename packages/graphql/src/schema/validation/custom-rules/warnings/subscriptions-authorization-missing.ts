/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTVisitor, ObjectTypeDefinitionNode } from "graphql";
import { getDirectiveNames } from "../utils/get-directive-names";

export function WarnIfSubscriptionsAuthorizationMissing(subscriptions: boolean) {
    return function (): ASTVisitor {
        let warningAlreadyIssued = false;

        return {
            ObjectTypeDefinition(objectType: ObjectTypeDefinitionNode) {
                if (warningAlreadyIssued || !subscriptions) {
                    return;
                }

                const directiveNames = getDirectiveNames(objectType);

                if (
                    directiveNames.includes("authorization") &&
                    !directiveNames.includes("subscriptionsAuthorization")
                ) {
                    console.warn(
                        "'@subscriptionsAuthorization' not found on a type/field which has '@authorization' - subscriptions events are not subject to the authorization rules specified in '@authorization' directives."
                    );
                    warningAlreadyIssued = true;
                }
            },
        };
    };
}
