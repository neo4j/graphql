FROM node:20.11.0-buster-slim@sha256:37ee73cccdf34a6f68782323b11645fc21abdd421b3814401ddc88be04e00103

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
