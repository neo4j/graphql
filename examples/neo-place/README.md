# Neo/Place

## Getting Started

1. Setup a .env file with the neo4j credentials:

```
NEO_PLACE_DB_URL: ""
NEO_PLACE_DB_PASSWORD: ""
NEO_PLACE_AMQP_URL: ""
NEO4J_USER: ""
```

* (optional) Use `docker-compose up rabbitmq` to launch a local RabbitMQ.
* (optional) Set `NEO_PLACE_AMQP_URL`, if no env variable is set, local subscriptions will be used.


2. Run `npm run start:dev`
3. Go to http://localhost:4000/

## Deploy
This deployment assumes a valid app engine in gcloud

1. Have a .env file with the required credentials as above
2. Run `bash deploy.sh`
