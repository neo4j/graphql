FROM node:20.11.0-buster-slim@sha256:a0a61787d8a3e68bcaa7182fa7f7e4964a29c8c35823d0aeea5feab0fc53402c

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .
COPY ./.yarn/ /app/.yarn/
COPY packages/graphql/package.json /app/packages/graphql/
COPY packages/ogm/package.json /app/packages/ogm/
COPY packages/package-tests/package.json /app/packages/package-tests/

RUN yarn

COPY . ./

CMD ["yarn", "test"]
