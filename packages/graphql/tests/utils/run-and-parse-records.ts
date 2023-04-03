import type { Session } from "neo4j-driver";
import type { QueryResult } from "neo4j-driver";

/** Runs the given cypher and returns the first record of the result, throwing if no columns are returned */
export async function runAndParseRecords(
    session: Session,
    cypher: string,
    params?: Record<string, unknown>
): Promise<Record<PropertyKey, any>> {
    const result = await session.run(cypher, params);
    return extractFirstRecord(result);
}

function extractFirstRecord(records: QueryResult<Record<PropertyKey, any>>): Record<PropertyKey, any> {
    const record = records.records[0];
    if (!record) throw new Error("Record is undefined, i.e. no columns returned from neo4j-driver in test");
    return record.toObject();
}
