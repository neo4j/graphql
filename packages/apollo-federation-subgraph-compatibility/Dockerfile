FROM node:lts@sha256:f627d0e594bbc713de73c2c50d18033c89e114cb1645c3b520b201426cfe1975

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]