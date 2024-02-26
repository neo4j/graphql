FROM node:20.11.1-buster-slim@sha256:cb17b5868d11ec6f2ecf30ce43330ca3e4c7fe1b20955af4de9d8f7d81a87b0a

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
