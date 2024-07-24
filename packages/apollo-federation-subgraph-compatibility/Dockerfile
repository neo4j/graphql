FROM node:lts@sha256:b515e3af865b74f0a4da0a1f31881a6d1b9793bf5aaad782fcf2c933f3b66412

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]