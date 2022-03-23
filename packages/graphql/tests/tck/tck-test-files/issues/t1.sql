MATCH (this:Drive)
WHERE this.current = $this_current
CALL {
  WITH this
  MATCH (this)-[this_consists_of_relationship:CONSISTS_OF]->(this_drivecomposition:DriveComposition)
  WHERE this_consists_of_relationship.current = $this_driveCompositionsConnection.args.
  WHERE .edge.current
  CALL {
  WITH this_drivecomposition
  CALL {
  WITH this_drivecomposition
  MATCH (this_drivecomposition)-[this_drivecomposition_has_relationship:HAS]->(this_drivecomposition_Battery:Battery)
  WHERE this_drivecomposition_has_relationship.current = $this_driveCompositionsConnection.edges.node.driveComponentConnection.args.where.Battery.edge.current
  CALL apoc.util.validate( NOT ((ANY(r IN ["admin"]
  WHERE ANY(rr IN $auth.roles
  WHERE r = rr)) AND apoc.util.validatePredicate( NOT ($auth.isAuthenticated = true ), "@neo4j/graphql/UNAUTHENTICATED", [0]))), "@neo4j/graphql/FORBIDDEN", [0])
  WITH { current: this_drivecomposition_has_relationship.current, node: { __resolveType: "Battery", id: this_drivecomposition_Battery.id, batterySeriesNumber: this_drivecomposition_Battery.batterySeriesNumber, nameMigrated: this_drivecomposition_Battery.nameMigrated
} } AS edge
RETURN edge


UNION


WITH this_drivecomposition
MATCH (this_drivecomposition)-[this_drivecomposition_has_relationship:HAS]->(this_drivecomposition_CombustionEngine:CombustionEngine)
WHERE this_drivecomposition_has_relationship.current = $this_driveCompositionsConnection.edges.node.driveComponentConnection.args.where.CombustionEngine.edge.current
WITH {
  current: this_drivecomposition_has_relationship.current, node: { __resolveType: "CombustionEngine", power: this_drivecomposition_CombustionEngine.power, torqueMaximum: this_drivecomposition_CombustionEngine.torqueMaximum
} } AS edge
RETURN edge
}


WITH collect(edge) AS edges
RETURN {
  edges: edges, totalCount: size(edges)
} AS driveComponentConnection
}
WITH collect({ node: {
  driveComponentConnection: driveComponentConnection
} }) AS edges
RETURN {
  edges: edges, totalCount: size(edges)
} AS driveCompositionsConnection
}
RETURN this {
  .state, createdAt: apoc.date.convertFormat(toString(this.createdAt), "iso_zoned_date_time", "iso_offset_date_time"), .current, driveCompositionsConnection
} AS this
