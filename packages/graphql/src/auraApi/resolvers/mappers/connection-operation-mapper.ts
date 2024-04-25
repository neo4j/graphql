import type { ExecuteResult } from "../../../utils/execute";

export function mapConnectionRecord(executionResult: ExecuteResult): any {
    // Note: Connections only return a single record
    const connections = executionResult.records.map((x) => x.this);

    return { connection: connections[0] };
}
