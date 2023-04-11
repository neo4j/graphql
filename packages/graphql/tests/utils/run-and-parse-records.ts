import type { QueryResult, Session } from "neo4j-driver";

/** Runs the given cypher and returns the first record of the result, throwing if no columns are returned */
export async function runAndParseRecords<T extends Record<string, unknown>>(
    session: Session,
    cypher: string,
    params?: Record<string, unknown>
): Promise<T> {
    const result = await session.run<T>(cypher, params);
    return extractFirstRecord(result);
}

function extractFirstRecord<T>(records: QueryResult<Record<PropertyKey, any>>): T {
    const record = records.records[0];
    if (!record) throw new Error("Record is undefined, i.e. no columns returned from neo4j-driver in test");
    return record.toObject();
}
