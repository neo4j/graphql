/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DEPRECATED } from "../constants";

// TODO: Add constant deprecations here

export function DEPRECATE_SET_MUTATION(name: string) {
    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the generic mutation '${name}: { set: ... } }' instead.`,
        },
    };
}

export function DEPRECATE_ARRAY_MUTATIONS(name: string, operation: "push" | "pop") {
    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the generic mutation '${name}: { ${operation}: ... } }' instead.`,
        },
    };
}

export function DEPRECATE_MATH_MUTATIONS(name: string, operation: string) {
    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the relevant generic mutation '${name}: { ${operation}: ... } }' instead.`,
        },
    };
}

export function DEPRECATE_AGGREGATION_FILTERS(name: string, aggregationOperation: string, operator: string) {
    let newOperator = operator.toLowerCase();
    if (newOperator === "equal") {
        newOperator = "eq";
    }

    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the relevant generic filter '${name}: { ${aggregationOperation}: { ${newOperator}: ... } } }' instead.`,
        },
    };
}

export function DEPRECATE_AGGREGATION_INPUT_FILTERS(aggregationOperation: string, operator: string) {
    let newOperator = operator.toLowerCase();
    if (newOperator === "equal") {
        newOperator = "eq";
    }

    return {
        name: DEPRECATED,
        args: {
            reason: `Please use the relevant generic filter '{ ${aggregationOperation}: { ${newOperator}: ... } } }' instead.`,
        },
    };
}
