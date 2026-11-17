import * as matchers from "jest-extended";
import { expect } from "vitest";

expect.extend(matchers);

// Jest treats two errors as equal when their messages are equal. Vitest also compares their other
// properties, such as the locations and path of a GraphQLError. Many tests compare received errors
// with `new GraphQLError(message)`, so keep Jest's rule. It also applies to jest-extended matchers
// such as toIncludeSameMembers.
expect.addEqualityTesters([
    function errorsEqualByMessage(a: unknown, b: unknown): boolean | undefined {
        if (a instanceof Error && b instanceof Error) {
            return a.message === b.message;
        }
        return undefined;
    },
]);
