import Cypher from "@neo4j/cypher-builder";

export const apocWrapper = {
    validatePredicate(predicate: Cypher.Predicate, message: string): Cypher.Function {
        return new Cypher.Function("apoc.util.validatePredicate", [
            predicate,
            new Cypher.Literal(message),
            new Cypher.Literal([0]),
        ]);
    },
    validate(
        predicate: Cypher.Predicate,
        message: string,
        params: Cypher.List | Cypher.Literal | Cypher.Map = new Cypher.List([])
    ): Cypher.VoidProcedure {
        return new Cypher.VoidProcedure("apoc.util.validate", [predicate, new Cypher.Literal(message), params]);
    },
    convertFormat(temporalParam: Cypher.Expr, currentFormat: string, convertTo = "yyyy-MM-dd"): Cypher.Function {
        return new Cypher.Function("apoc.date.convertFormat", [
            Cypher.toString(temporalParam), // NOTE: should this be `toString` by default?
            new Cypher.Literal(currentFormat),
            new Cypher.Literal(convertTo),
        ]);
    },
};
