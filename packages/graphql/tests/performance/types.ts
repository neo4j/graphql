/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export type ProfileResult = {
    maxRows: number;
    dbHits: number;
    cache: {
        hits: number;
        misses: number;
    };
    memory: number;
};

export type Result = ProfileResult & { time: number };

export type ErroredDisplayData = {
    name: string;
    file: string;
    type: "cypher" | "graphql";
    error: string;
};

export type CorrectDisplayData = {
    name: string;
    result: Result;
    file: string;
    type: "cypher" | "graphql";
    error?: undefined;
};

export type TestDisplayData = CorrectDisplayData | ErroredDisplayData;

export type TestInfo = { query: string; name: string; filename: string; type: "query" | "mutation" | "cypher" };
