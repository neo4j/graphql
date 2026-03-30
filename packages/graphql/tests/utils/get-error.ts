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

export const getErrorAsync = async <TError>(call: () => unknown): Promise<TError[]> => {
    try {
        await call();
        throw new NoErrorThrownError();
    } catch (error: unknown) {
        return error as Promise<TError[]>;
    }
};
