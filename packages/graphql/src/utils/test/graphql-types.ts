// eslint-disable-next-line import/no-extraneous-dependencies
import { generate } from "randomstring";
import pluralize from "pluralize";
import camelCase from "camelcase";

export function generateUniqueType(baseName: string): TestType {
    const type = `${generate({
        charset: "alphabetic",
        readable: true,
    })}${baseName}`;

    const plural = pluralize(camelCase(type));
    return {
        name: type,
        plural,
    };
}

export type TestType = {
    name: string;
    plural: string;
};
