/* eslint-disable no-inner-declarations */
import { DirectiveNode, valueFromASTUntyped } from "graphql";
import { Auth, AuthRule, AuthConstructor } from "../classes";

function getAuth(directive: DirectiveNode): Auth {
    const authConstructor: AuthConstructor = { rules: [] };

    const rules = directive.arguments?.find((x) => x.name.value === "rules");

    if (!rules) {
        throw new Error("auth rules required");
    }

    if (rules.value.kind !== "ListValue") {
        throw new Error("auth rules must be a ListValue");
    }

    const parsedRules = valueFromASTUntyped(rules.value) as AuthRule[];

    parsedRules.forEach((rule, index) => {
        const valueIsObject = Boolean(!Array.isArray(rule) && Object.keys(rule).length && typeof rule !== "string");
        if (!valueIsObject) {
            throw new Error(`rules[${index}] must be a ObjectValue`);
        }

        if (!rule.operations) {
            throw new Error(`rules[${index}].operations required`);
        }

        if (!Array.isArray(rule.operations)) {
            throw new Error(`rules[${index}].operations must be a ListValue`);
        }

        if (!rule.operations.length) {
            throw new Error(`rules[${index}].operations cant be empty`);
        }

        rule.operations.forEach((op, opIndex) => {
            if (typeof op !== "string") {
                throw new Error(`rules[${index}].operations[${opIndex}] invalid`);
            }

            if (!["create", "read", "update", "delete"].includes(op)) {
                throw new Error(`rules[${index}].operations[${opIndex}] invalid`);
            }
        });

        if (rule.isAuthenticated) {
            if (typeof rule.isAuthenticated !== "boolean") {
                throw new Error(`rules[${index}].isAuthenticated must be a BooleanValue`);
            }
        }

        if (rule.roles) {
            if (!Array.isArray(rule.roles)) {
                throw new Error(`rules[${index}].roles must be a ListValue`);
            }

            rule.roles.forEach((role, i) => {
                if (typeof role !== "string") {
                    throw new Error(`rules[${index}].roles[${i}] must be a StringValue`);
                }
            });
        }
    });

    authConstructor.rules = parsedRules;

    return new Auth(authConstructor);
}

export default getAuth;
