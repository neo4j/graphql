/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTVisitor, DirectiveNode } from "graphql";
import type { Neo4jAuthorizationSettings } from "../../../../types";

export function WarnIfAuthorizationFeatureDisabled(authorization: Neo4jAuthorizationSettings | undefined) {
    return function (): ASTVisitor {
        let warningAlreadyIssued = false;

        return {
            Directive(directive: DirectiveNode) {
                if (
                    !warningAlreadyIssued &&
                    !authorization &&
                    ["authentication", "authorization", "subscriptionsAuthorization"].includes(directive.name.value)
                ) {
                    console.warn(
                        "'@authentication', '@authorization' and/or @subscriptionsAuthorization detected - please ensure that you either specify authorization settings in 'features.authorization'. This warning can be ignored if you intend to pass a decoded JWT into 'context.jwt' on every request."
                    );
                    warningAlreadyIssued = true;
                }
            },
        };
    };
}
