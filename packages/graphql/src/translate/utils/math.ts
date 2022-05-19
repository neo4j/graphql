// Map Neo4jGraphQL Math operator to Cypher symbol
const CypherOperatorMapper = new Map<string, string>([
    ["_ADD", "+"],
    ["_SUBTRACT", "-"],
    ["_MULTIPLY", "*"],
    ["_DIVIDE", "/"],
    ["_INCREMENT", "+"],
    ["_DECREMENT", "-"]
]);

export function mathOperatorToSymbol(mathOperator: string): string {
    if (CypherOperatorMapper.has(mathOperator)) {
        return CypherOperatorMapper.get(mathOperator) as string;
    }
    throw new Error(`${mathOperator} is not a valid math operator`);
}