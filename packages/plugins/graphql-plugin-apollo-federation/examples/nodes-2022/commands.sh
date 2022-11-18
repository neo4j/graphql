curl -sSL https://router.apollo.dev/download/nix/latest | sh
ts-node -r tsconfig-paths/register examples/nodes-2022/src/products.ts
ts-node -r tsconfig-paths/register examples/nodes-2022/src/reviews.ts
rover supergraph compose --config supergraph.yaml > supergraph.graphql
./router --dev --supergraph supergraph.graphql