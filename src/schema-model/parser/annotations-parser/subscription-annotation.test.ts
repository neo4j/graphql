/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import { parseSubscriptionAnnotation } from "./subscription-annotation";
import { subscriptionDirective } from "../../../graphql/directives";

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
