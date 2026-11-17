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
 * Returns the message of a thrown `Error`, or any other thrown value as a string, or an empty
 * string when nothing is thrown. A thrown array of GraphQLErrors gives each error's message and
 * printed source locations, joined with commas. Vitest's `toThrow` reads `message` only, so it
 * matches nothing on the arrays that schema validation throws.
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
