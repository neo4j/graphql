FROM node:20.11.1-buster-slim@sha256:107326dd02fe0bc70b7e897c5c1ac0820918a77a6f138cbad5c5aef751924bfc

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
