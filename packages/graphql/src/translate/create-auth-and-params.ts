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

import type { Node } from "../classes";
import { Neo4jGraphQLAuthenticationError } from "../classes";
import type { AuthOperations, BaseField, AuthRule, BaseAuthRule, Context } from "../types";
import { AUTH_UNAUTHENTICATED_ERROR } from "../constants";
import mapToDbProperty from "../utils/map-to-db-property";
import joinPredicates, { isPredicateJoin, PREDICATE_JOINS } from "../utils/join-predicates";
import ContextParser from "../utils/context-parser";
import { isString } from "../utils/utils";
import { NodeAuth } from "../classes/NodeAuth";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { compileCypherIfExists } from "./cypher-builder/utils";
import { AuthBuilder } from "./create-auth-and-params-cypher";

interface Res {
    strs: string[];
    params: any;
}

interface Allow {
    varName: string;
    parentNode: Node;
    chainStr?: string;
}

interface Bind {
    varName: string;
    parentNode: Node;
    chainStr?: string;
}

export default function createAuthAndParams({
    entity,
    operations,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    escapeQuotes,
    bind,
    where,
}: {
    entity: Node | BaseField;
    operations?: AuthOperations | AuthOperations[];
    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Allow;
    context: Context;
    escapeQuotes?: boolean;
    bind?: Bind;
    where?: { varName: string; chainStr?: string; node: Node };
}): [string, any] {
    if (!entity.auth) {
        return ["", {}];
    }

    /** FIXME: this is required to keep compatibility with BaseField type */
    const nodeAuth = new NodeAuth(entity.auth);
    const authRules = nodeAuth.getRules(operations);

    const hasWhere = (rule: BaseAuthRule): boolean =>
        !!(rule.where || rule.AND?.some(hasWhere) || rule.OR?.some(hasWhere));

    if (where && !authRules.some(hasWhere)) {
        return ["", [{}]];
    }
    const subPredicates = authRules.map((authRule: AuthRule, index) => {
        const predicate = createSubPredicate({
            authRule,
            index,
            skipRoles,
            skipIsAuthenticated,
            allow,
            context,
            escapeQuotes,
            bind,
            where,
        });

        return predicate;

        // return {
        //     strs: [...res.strs, str],
        //     params: { ...res.params, ...par },
        // };
    });

    const orPredicates = CypherBuilder.or(...subPredicates);
    if (!orPredicates) return ["", {}];

    const authPredicate = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        return orPredicates.getCypher(env);
    });
    const authCypher = authPredicate.build();
    return [authCypher.cypher, authCypher.params];
}

function createSubPredicate({
    authRule,
    index,
    chainStr,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    escapeQuotes,
    bind,
    where,
}: {
    authRule: AuthRule | BaseAuthRule;
    index: number;
    chainStr?: string;

    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Allow;
    context: Context;
    escapeQuotes?: boolean;
    bind?: Bind;
    where?: { varName: string; chainStr?: string; node: Node };
}): CypherBuilder.Predicate | undefined {
    const thisPredicates: CypherBuilder.Predicate[] = [];
    const authParam = new CypherBuilder.NamedParam("auth");
    // const thisPredicates: string[] = [];
    // let thisParams: any = {};

    if (!skipRoles && authRule.roles) {
        const rolesPredicate = AuthBuilder.createRolesPredicate(authRule.roles, authParam.property("roles"));
        thisPredicates.push(rolesPredicate);
        // thisPredicates.push(createRolesStr({ roles: authRule.roles, escapeQuotes }));
    }

    // const quotes = escapeQuotes ? '\\"' : '"';
    if (!skipIsAuthenticated && (authRule.isAuthenticated === true || authRule.isAuthenticated === false)) {
        const authenticatedPredicate = AuthBuilder.createAuthenticatedPredicate(
            authRule.isAuthenticated,
            authParam.property("isAuthenticated")
        );
        thisPredicates.push(authenticatedPredicate);
        // thisPredicates.push(
        //     `apoc.util.validatePredicate(NOT ($auth.isAuthenticated = ${Boolean(
        //         authRule.isAuthenticated
        //     )}), ${quotes}${AUTH_UNAUTHENTICATED_ERROR}${quotes}, [0])`
        // );
    }

    if (allow && authRule.allow) {
        const allowAndParams = createAuthPredicate({
            context,
            node: allow.parentNode,
            varName: allow.varName,
            rule: authRule,
            chainStr: `${allow.chainStr || allow.varName}${chainStr || ""}_auth_allow${index}`,
            kind: "allow",
        });
        if (allowAndParams[0]) {
            const authPredicate = new CypherBuilder.RawCypher(() => {
                return allowAndParams;
            });
            thisPredicates.push(authPredicate);
            // thisPredicates.push(allowAndParams[0]);
            // thisParams = { ...thisParams, ...allowAndParams[1] };
        }
    }

    PREDICATE_JOINS.forEach((key) => {
        const value = authRule[key] as AuthRule["AND"] | AuthRule["OR"];

        if (!value) {
            return;
        }

        const predicates: CypherBuilder.Predicate[] = [];
        // let predicateParams = {};

        value.forEach((v, i) => {
            const predicate = createSubPredicate({
                authRule: v,
                index: i,
                chainStr: chainStr ? `${chainStr}${key}${i}` : `${key}${i}`,
                skipRoles,
                skipIsAuthenticated,
                allow,
                context,
                escapeQuotes,
                bind,
                where,
            });

            if (!predicate) {
                return;
            }

            predicates.push(predicate);
            // predicateParams = { ...predicateParams, ...par };
        });

        let joinedPredicate: CypherBuilder.Predicate | undefined;
        if (key === "AND") {
            joinedPredicate = CypherBuilder.and(...predicates);
        } else if (key === "OR") {
            joinedPredicate = CypherBuilder.or(...predicates);
        }
        if (joinedPredicate) {
            // const joinedStatement = new CypherBuilder.RawCypher((env) => {
            //     return compileCypherIfExists(joinedPredicate, env);
            // });
            // const result = joinedStatement.build();
            thisPredicates.push(joinedPredicate);
            // thisPredicates.push(joinedStatement);
            // thisParams = { ...thisParams, ...result.params };
        }

        // thisPredicates.push(joinPredicates(predicates, key));
        // thisParams = { ...thisParams, ...predicateParams };
    });

    if (where && authRule.where) {
        const whereAndParams = createAuthPredicate({
            context,
            node: where.node,
            varName: where.varName,
            rule: authRule,
            chainStr: `${where.chainStr || where.varName}${chainStr || ""}_auth_where${index}`,
            kind: "where",
        });
        if (whereAndParams[0]) {
            const authPredicate = new CypherBuilder.RawCypher(() => {
                return whereAndParams;
            });
            thisPredicates.push(authPredicate);
            // thisPredicates.push(whereAndParams[0]);
            // thisParams = { ...thisParams, ...whereAndParams[1] };
        }
    }

    if (bind && authRule.bind) {
        const allowAndParams = createAuthPredicate({
            context,
            node: bind.parentNode,
            varName: bind.varName,
            rule: authRule,
            chainStr: `${bind.chainStr || bind.varName}${chainStr || ""}_auth_bind${index}`,
            kind: "bind",
        });
        if (allowAndParams[0]) {
            const authPredicate = new CypherBuilder.RawCypher(() => {
                return allowAndParams;
            });
            thisPredicates.push(authPredicate);
            // thisPredicates.push(allowAndParams[0]);
            // thisParams = { ...thisParams, ...allowAndParams[1] };
        }
    }

    return CypherBuilder.and(...thisPredicates);
    // return new CypherBuilder.RawCypher(() => {
    // return [joinPredicates(thisPredicates, "AND"), thisParams];
    // });
}

// function createRolesStr({ roles, escapeQuotes }: { roles: string[]; escapeQuotes?: boolean }) {
//     const quote = escapeQuotes ? `\\"` : `"`;

//     const joined = roles.map((r) => `${quote}${r}${quote}`).join(", ");

//     return `any(r IN [${joined}] WHERE any(rr IN $auth.roles WHERE r = rr))`;
// }

function createAuthPredicate({
    rule,
    node,
    varName,
    context,
    chainStr,
    kind,
}: {
    context: Context;
    varName: string;
    node: Node;
    rule: AuthRule;
    chainStr: string;
    kind: "allow" | "bind" | "where";
}): [string, any] {
    if (!rule[kind]) {
        return ["", {}];
    }

    const { allowUnauthenticated } = rule;

    const result = Object.entries(rule[kind] as any).reduce(
        (res: Res, [key, value]) => {
            // AND / OR

            if (isPredicateJoin(key)) {
                const inner: string[] = [];

                (value as any[]).forEach((v, i) => {
                    const authPredicate = createAuthPredicate({
                        rule: {
                            [kind]: v,
                            allowUnauthenticated,
                        } as AuthRule,
                        varName,
                        node,
                        chainStr: `${chainStr}_${key}${i}`,
                        context,
                        kind,
                    });

                    inner.push(authPredicate[0]);
                    res.params = { ...res.params, ...authPredicate[1] };
                });

                res.strs.push(joinPredicates(inner, key));
            }

            const authableField = node.authableFields.find((field) => field.fieldName === key);
            // FIELDS
            if (authableField) {
                const jwtPath = isString(value) ? ContextParser.parseTag(value, "jwt") : undefined;
                let ctxPath = isString(value) ? ContextParser.parseTag(value, "context") : undefined;
                let paramValue = value as string | undefined;

                if (jwtPath) ctxPath = `jwt.${jwtPath}`;

                if (ctxPath) {
                    paramValue = ContextParser.getProperty(ctxPath, context);
                }

                if (paramValue === undefined && allowUnauthenticated !== true) {
                    throw new Neo4jGraphQLAuthenticationError("Unauthenticated");
                }

                const dbFieldName = mapToDbProperty(node, key);
                if (paramValue === undefined) {
                    res.strs.push("false");
                } else if (paramValue === null) {
                    res.strs.push(`${varName}.${dbFieldName} IS NULL`);
                } else {
                    const param = `${chainStr}_${key}`;
                    res.params[param] = paramValue;
                    res.strs.push(`${varName}.${dbFieldName} IS NOT NULL AND ${varName}.${dbFieldName} = $${param}`);
                }
            }

            const relationField = node.relationFields.find((x) => key === x.fieldName);
            // ON RELATION FIELDS
            if (relationField) {
                const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;
                const relationVarName = relationField.fieldName;
                const labels = refNode.getLabelString(context);
                let resultStr = [
                    `exists((${varName})${inStr}${relTypeStr}${outStr}(${labels}))`,
                    `AND ${
                        kind === "allow" ? "any" : "all"
                    }(${relationVarName} IN [(${varName})${inStr}${relTypeStr}${outStr}(${relationVarName}${labels}) | ${relationVarName}] WHERE `,
                ].join(" ");

                Object.entries(value as any).forEach(([k, v]: [string, any]) => {
                    const authPredicate = createAuthPredicate({
                        node: refNode,
                        context,
                        chainStr: `${chainStr}_${key}`,
                        varName: relationVarName,
                        rule: {
                            [kind]: { [k]: v },
                            allowUnauthenticated,
                        } as AuthRule,
                        kind,
                    });
                    resultStr += authPredicate[0];
                    resultStr += ")"; // close ALL
                    res.params = { ...res.params, ...authPredicate[1] };
                    res.strs.push(resultStr);
                });
            }

            return res;
        },
        { params: {}, strs: [] }
    );

    return [joinPredicates(result.strs, "AND"), result.params];
}
