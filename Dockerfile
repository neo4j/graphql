FROM node:20.12.2-buster-slim@sha256:c5b9c0863b4a9559cad0ec02544859fdc30feb65603760aa30abc0dd5195afdf

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
