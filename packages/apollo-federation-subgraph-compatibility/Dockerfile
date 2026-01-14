FROM node:lts@sha256:929c026d5a4e4a59685b3c1dbc1a8c3eb090aa95373d3a4fd668daa2493c8331

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]