/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import { subscriptionDirective } from "../../../graphql/directives";
import { parseSubscriptionAnnotation } from "./subscription-annotation";

const tests = [
    {
        name: "should parse correctly when CREATED event is passed",
        directive: makeDirectiveNode("subscription", { events: ["CREATED"] }, subscriptionDirective),
        events: new Set(["CREATED"]),
        expected: { events: new Set(["CREATED"]) },
    },
    {
        name: "should parse correctly when UPDATED event is passed",
        directive: makeDirectiveNode("subscription", { events: ["UPDATED"] }, subscriptionDirective),
        events: new Set(["UPDATED"]),
        expected: { events: new Set(["UPDATED"]) },
    },
    {
        name: "should parse correctly when CREATE and UPDATE events are passed",
        directive: makeDirectiveNode("subscription", { events: ["CREATED", "UPDATED"] }, subscriptionDirective),
        events: new Set(["CREATED", "UPDATED"]),
        expected: { events: new Set(["CREATED", "UPDATED"]) },
    },
];

describe("parseSubscriptionAnnotation", () => {
    tests.forEach((test) => {
        it(`${test.name}`, () => {
            const subscriptionAnnotation = parseSubscriptionAnnotation(test.directive);
            expect(subscriptionAnnotation.events).toEqual(test.events);
        });
    });
});
