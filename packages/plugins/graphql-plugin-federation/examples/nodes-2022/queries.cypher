USE store.products
MATCH (p:Product)
RETURN p { .* } AS product
  UNION
USE store.reviews
MATCH (p:Product)-[:HAS_REVIEW]->(r:Review)
WITH p, collect(r) AS reviews
RETURN p { .*, reviews } AS product


CALL {
    USE store.products
    MATCH (p:Product)
    RETURN p { .* } AS product, p.id as productId
}
CALL {
    WITH productId
    USE store.reviews
    MATCH (p:Product { id: productId })-[:HAS_REVIEW]->(r:Review)
    WITH p, collect(r { .* }) AS reviews
    RETURN p { .*, reviews } AS reviewedProduct
}
RETURN apoc.map.merge(product, reviewedProduct) AS products