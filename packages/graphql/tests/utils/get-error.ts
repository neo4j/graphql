/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export class NoErrorThrownError extends Error {}
export const getError = <TError extends Error>(call: () => unknown): TError[] => {
    try {
        call();
        throw new NoErrorThrownError();
    } catch (error: unknown) {
        return error as TError[];
    }
};

/**
 * Returns the message that Jest's `toThrow(string)` matched against: the message of a thrown
 * `Error`, or any other thrown value as a string. A thrown array of GraphQLErrors gives each
 * error's message and printed source locations, joined with commas. Returns an empty string when
 * nothing is thrown. Vitest's `toThrow` reads `message` only, so it matches nothing on the arrays
 * that schema validation throws.
 */
export const getThrownMessage = (call: () => unknown): string => {
    try {
        call();
        return "";
    } catch (error: unknown) {
        return error instanceof Error ? error.message : String(error);
    }
};

export const getErrorAsync = async <TError>(call: () => unknown): Promise<TError[]> => {
    try {
        await call();
        throw new NoErrorThrownError();
    } catch (error: unknown) {
        return error as Promise<TError[]>;
    }
};
