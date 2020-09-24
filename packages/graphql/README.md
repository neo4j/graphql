# @neo4j/graphql

Neo4j GraphQL Lib in TypeScript

### Installation

```
$ npm ci
```

### Development

```
$ npm run dev
```

### Building

```
$ npm run build
```

### Testing

#### Unit
```
$ npm test:init
```

#### Integration
_You need a neo4j instance_
```
$ cross-env NEO_USER=admin NEO_PASSWORD=password NEO_URL=neo4j://localhost:7687/neo4j npm run test:int
```

_Running with docker 🐋_
```
$ docker-compose -f ./docker-compose.integration.test.yml up --build --abort-on-container-exit --exit-code-from integration
```


