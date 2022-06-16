# Neo/Place

## Getting Started
Neo/place can easily be run locally. To run neo/place you need to have Node.js and a running Neo4j database.

1. Create a `.env` file with the neo4j credentials:
```sh
NEO_PLACE_DB_URL=bolt://localhost:7687
NEO_PLACE_DB_USER=neo4j
NEO_PLACE_DB_PASSWORD=neo4j
```
2. Run `npm install`
3. Run `npm run start:dev`
4. Go to http://localhost:4000/

### Using AMQP broker for messages (optional)
By default, events will only be sent to subscribers of the same server, making it impossible to horizontally scale the server (more info [here](https://neo4j.com/docs/graphql-manual/current/subscriptions/scaling/)).
You can use AMQP as a broker if you plan on hosting multiple servers:

1. Add `NEO_PLACE_AMQP_URL` to `.env` file with the full URL to your AMQP server (including user and password):
```sh
NEO_PLACE_AMQP_URL=amqp://guest:guest@localhost
```
2. (optional) Run `docker-compose up rabbitmq` to run a local RabbitMQ broker

## Deploy
This deployment assumes a valid app engine setup in gcloud

1. Have a `.env` file with the required credentials as described above
2. Run `bash deploy.sh`
