FROM node:lts@sha256:e06aae17c40c7a6b5296ca6f942a02e6737ae61bbbf3e2158624bb0f887991b5

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]