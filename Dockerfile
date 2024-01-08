FROM node:20.10.0-buster-slim@sha256:d0acb10d0062944abd19d56d79f4953de6bba167b04c961c6eba6054fbc4990c

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
