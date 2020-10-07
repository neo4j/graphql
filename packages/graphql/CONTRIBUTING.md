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
$ npm test:unit
```

#### Integration
_You need a neo4j instance_
```
$ cross-env NEO_USER=admin NEO_PASSWORD=password NEO_URL=neo4j://localhost:7687/neo4j npm run test:int
```

#### TCK
```
$ npm test:tck
```

#### All together
```
$ npm run test
```

