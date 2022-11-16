USE store.products
MATCH (p:Product)
RETURN p { .* } AS product
  UNION
USE store.reviews
MATCH (p:Product)-[:HAS_REVIEW]->(r:Review)
WITH p, collect(r) AS reviews
RETURN p { .*, reviews } AS product
