FROM node:lts@sha256:2ff27bf5505de4b7dd9b92f079c995a1863fb16db7e462ceec0b96782f07e350

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]