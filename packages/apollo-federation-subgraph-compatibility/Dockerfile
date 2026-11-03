FROM node:26.13.0@sha256:6d2c7d5d074bf72f81ddc252b4fbb5d625bc028eeda49cb4b8c2ff8eda1ee617

WORKDIR /app

COPY ["dist/bundle.js", "./"]

USER node

EXPOSE 4001

CMD [ "node", "bundle.js" ]