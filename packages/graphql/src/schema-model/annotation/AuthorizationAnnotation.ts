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

import type { Annotation } from "./Annotation";

export class AuthorizationAnnotation implements Annotation {
    name = "AUTHORIZATION";
    filter?: AuthorizationFilterRule[];
    validatePre?: AuthorizationFilterRule[];
    validatePost?: AuthorizationFilterRule[];
    filterSubscriptions?: AuthorizationFilterRule[];

    constructor({
        filter,
        validatePre,
        validatePost,
        filterSubscriptions,
    }: {
        filter?: AuthorizationFilterRule[];
        validatePre?: AuthorizationFilterRule[];
        validatePost?: AuthorizationFilterRule[];
        filterSubscriptions?: AuthorizationFilterRule[];
    }) {
        this.filter = filter;
        this.validatePre = validatePre;
        this.validatePost = validatePost;
        this.filterSubscriptions = filterSubscriptions;
    }
}

export type AuthorizationFilterOperation =
    | "READ"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "CREATE_RELATIONSHIP"
    | "DELETE_RELATIONSHIP";

const AuthorizationFilterRules = {
    filter: "AuthorizationFilterValidationRule",
    filterSubscription: "AuthorizationFilterSubscriptionValidationRule",
    validationPre: "AuthorizationPreValidationRule",
    validationPost: "AuthorizationPostValidationRule",
} as const;
export type AuthorizationFilterRuleType = typeof AuthorizationFilterRules[keyof typeof AuthorizationFilterRules];

const getDefaultRuleOperations = (
    ruleType: AuthorizationFilterRuleType
): AuthorizationFilterOperation[] | undefined => {
    switch (ruleType) {
        case AuthorizationFilterRules.filter:
            return ["READ", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"];
        case AuthorizationFilterRules.validationPre:
            return ["READ", "CREATE", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"];
        case AuthorizationFilterRules.validationPost:
            return ["CREATE", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"];
        default:
            return undefined;
    }
};

export class AuthorizationFilterRule {
    // UserAuthorizationFilterRule
    operations?: AuthorizationFilterOperation[]; // AuthorizationFilterOperation, this is not available for subscription
    requireAuthentication: boolean;
    where: AuthorizationFilterWhere; // UserAuthorizationWhere

    constructor(rule: Record<string, any>) {
        const { operations, requireAuthentication, where, ruleType } = rule;

        this.operations = operations || getDefaultRuleOperations(ruleType);
        this.requireAuthentication = requireAuthentication === undefined ? true : requireAuthentication;
        this.where = new AuthorizationFilterWhere(where);

        this.validateRule();
    }

    // TODO: implement me
    private validateRule() {
        return true;
    }
}

export class AuthorizationFilterWhere {
    jwtPayload?: Record<string, any>;
    node?: Record<string, any>; // UserWhere

    constructor(where: { jwtPayload?: Record<string, any>; node?: Record<string, any> }) {
        if (!where.jwtPayload && !where.node) {
            throw new Error(
                "At least one between jwtPayload or node should be present to construct the AuthorizationFilterWhere"
            ); // TODO: Add a custom error with a a proper error message
        }
        this.jwtPayload = where.jwtPayload;
        this.node = where.node;
    }
}

// *****************
// *OperationTree classes
// ***************/*

/*
interface StringPredicate extends LogicalPredicate<StringPredicate> {
    equals?: string;
    in?: string;
    matches?: string;
    contains?: string;
    startsWith?: string;
    endsWith?: string;
}

interface ListPredicate<T> extends LogicalPredicate<ListPredicate<T>> {
    all?: T;
    some?: T;
    single?: T;
}

type LogicalPredicate<T> = {
    OR?: [T];
    AND?: [T];
    NOT?: T;
};

interface Predicate {
    getCypherPredicate(): Cypher.Predicate;
}

class EqualsPredicate implements Predicate {
    predicate: Cypher.Predicate;

    constructor(left, right) {
        this.predicate = Cypher.eq(left, right); // left = this0.id
    }

    getCypherPredicate(): Cypher.Predicate {
        return this.predicate;
    }
}

class SomePredicate implements Predicate {
    predicate: Cypher.Predicate;

    constructor(relationshipFilter: RelationshipFilter) {
        this.predicate = new Cypher.Exists(relationshipFilter.poop());
    }

    getCypherPredicate(): Cypher.Predicate {
        return this.predicate;
    }
}

class AndPredicate implements Predicate {
    predicate: Cypher.Predicate;

    constructor(...predicates: [Cypher.Predicate, Cypher.Predicate]) {
        this.predicate = Cypher.and(...predicates);
    }

    getCypherPredicate(): Cypher.Predicate {
        return this.predicate;
    }
}

class EntityPredicate implements Predicate {
    nodeRef: Cypher.Node; // maybe is not needed
    predicates: Predicate[]; // is this array or single value?
    constructor(nodeRef: Cypher.Node, predicates: Predicate[]) {
        this.nodeRef = nodeRef;
        this.predicates = predicates;
    }

    getCypherPredicate(): Cypher.Predicate {
        return this.predicates[0].getCypherPredicate();
        // return Cypher.and(); //Cypher.and(utils.mergePredicate(this.predicates.map(predicate => predicate.getCypherPredicate()));
    }
}

class RelationshipPredicate implements Predicate {
    relationshipRef: Cypher.Relationship; // maybe is not needed
    predicates: Predicate[];
    constructor(relationshipRef: Cypher.Relationship, predicates: Predicate[]) {
        this.relationshipRef = relationshipRef;
        this.predicates = predicates;
    }

    getCypherPredicate(): Cypher.Predicate {
        return Cypher.and(); //Cypher.and(utils.mergePredicate(this.predicates.map(predicate => predicate.getCypherPredicate()));
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Filter {}

class EntityFilter implements Filter {
    nodeRef: Cypher.Node;
    predicate: Predicate;

    constructor(nodeRef: Cypher.Node, constructablePredicate: unknown) {
        this.nodeRef = nodeRef;
        this.predicate = new Predicate(constructablePredicate); // build Predicate from constructable
    }

    poop(): Cypher.Predicate {
        //to be composed with Cypher.Match() or Cypher.With()
        return this.predicate.getCypherPredicate();
    }
}

class RelationshipFilter implements Filter {
    relationshipRef: Cypher.Relationship;
    predicate: Predicate;

    constructor(
        relationshipRef: Cypher.Relationship,
        nodePredicate: EntityPredicate,
        relationshipPredicate: RelationshipPredicate
    ) {
        this.relationshipRef = relationshipRef;
        this.predicate = new AndPredicate( // implicit "and"
            nodePredicate.getCypherPredicate(),
            relationshipPredicate.getCypherPredicate()
        );
    }

    poop(): Cypher.Clause {
        //this is a Clause, not a Predicate ??
        return new Cypher.Match(this.relationshipRef).where(this.predicate.getCypherPredicate());
    }
}
 */
