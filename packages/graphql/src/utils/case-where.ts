import Cypher from "@neo4j/cypher-builder";

export function caseWhere(predicate: Cypher.Predicate, columns: Cypher.List): Cypher.Clause {
    const caseProjection = new Cypher.Variable();
    const nullList = new Cypher.List(Array(columns.length).fill(new Cypher.Literal(null)));
    const caseFilter = new Cypher.Case(predicate).when(new Cypher.Literal(true)).then(columns).else(nullList);
    const aggregationWith = new Cypher.With("*", [caseFilter, caseProjection]).distinct();
    const columnsProjection = Array(columns.length).fill(() => undefined).map(
        (element, index) =>
            [new Cypher.ListAccessor(caseProjection, index), columns.get(index)] as [Cypher.Expr, Cypher.Variable]
    );
    const caseProjectionWith = new Cypher.With("*", ...columnsProjection);
    return Cypher.concat(aggregationWith, caseProjectionWith);
}