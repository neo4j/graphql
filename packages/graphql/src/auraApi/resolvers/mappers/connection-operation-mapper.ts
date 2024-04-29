import type { ExecuteResult } from "../../../utils/execute";

export function mapConnectionRecord(executionResult: ExecuteResult): any {
    // Note: Connections only return a single record
    const connections = executionResult.records.map((x) => x.this);
    console.log(JSON.stringify(connections, null, 2));
    return { connection: connections[0] };
}
