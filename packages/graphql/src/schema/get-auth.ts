import { DirectiveNode } from "graphql";
import { Auth, AuthRule, AuthOperations, AuthConstructor } from "../classes";

function getAuth(directive: DirectiveNode): Auth {
    const authConstructor: AuthConstructor = { rules: [] };

    const rules = directive.arguments?.find((x) => x.name.value === "rules");

    if (!rules) {
        throw new Error("auth rules required");
    }

    if (rules.value.kind !== "ListValue") {
        throw new Error("auth rules must be a ListValue");
    }

    rules.value.values.forEach((value, i) => {
        const rule: AuthRule = {};

        if (value.kind !== "ObjectValue") {
            throw new Error(`rules[${i}] must be a ObjectValue`);
        }

        const operations = value.fields.find((x) => x.name.value === "operations");

        if (!operations) {
            throw new Error(`rules[${i}].operations required`);
        }

        if (operations.value.kind !== "ListValue") {
            throw new Error(`rules[${i}].operations must be a ListValue`);
        }

        if (!operations.value.values.length) {
            throw new Error(`rules[${i}].operations cant be empty`);
        }

        operations.value.values.forEach((v, ii) => {
            if (v.kind !== "StringValue") {
                throw new Error(`rules[${i}].operations[${ii}] invalid`);
            }

            if (!["create", "read", "update", "delete"].includes(v.value)) {
                throw new Error(`rules[${i}].operations[${ii}] invalid`);
            }

            if (!rule.operations) {
                rule.operations = [];
            }

            const operation = (v.value as unknown) as AuthOperations;
            rule.operations.push(operation);
        });

        const isAuthenticated = value.fields.find((x) => x.name.value === "isAuthenticated");
        if (isAuthenticated) {
            if (isAuthenticated.value.kind !== "BooleanValue") {
                throw new Error(`rules[${i}].isAuthenticated must be a boolean`);
            }

            rule.isAuthenticated = Boolean(isAuthenticated.value.value);
        }

        const allow = value.fields.find((x) => x.name.value === "allow");
        if (allow) {
            if (!["ObjectValue", "StringValue"].includes(allow.value.kind)) {
                throw new Error(`rules[${i}].allow must be a ObjectValue or StringValue`);
            }

            if (allow.value.kind === "ObjectValue") {
                allow.value.fields.forEach((field) => {
                    if (field.value.kind !== "StringValue") {
                        throw new Error(`rules[${i}].allow[${field.name.value}] must be a string`);
                    }

                    if (!rule.allow) {
                        rule.allow = {};
                    }

                    rule.allow[field.name.value] = field.value.value;
                });
            }

            if (allow.value.kind === "StringValue") {
                if (allow.value.value !== "*") {
                    throw new Error(`rules[${i}].allow invalid StringValue`);
                }

                rule.allow = "*";
            }
        }

        const roles = value.fields.find((x) => x.name.value === "roles");
        if (roles) {
            if (roles.value.kind !== "ListValue") {
                throw new Error(`rules[${i}].roles must be a ListValue`);
            }

            roles.value.values.forEach((v, ii) => {
                if (v.kind !== "StringValue") {
                    throw new Error(`rules[${i}].roles[${ii}] must be a StringValue`);
                }

                if (!rule.roles) {
                    rule.roles = [];
                }

                rule.roles.push(v.value);
            });
        }

        authConstructor.rules.push(rule);
    });

    return new Auth(authConstructor);
}

export default getAuth;
