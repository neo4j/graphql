CYPHER 5
UNWIND $create_param0 AS create_var0
CALL (create_var0) {
    CREATE (create_this1:Movie)
    SET
        create_this1.id = create_var0.id,
        create_this1.title = create_var0.title
    RETURN create_this1
}
RETURN collect(create_this1 { .title }) AS data