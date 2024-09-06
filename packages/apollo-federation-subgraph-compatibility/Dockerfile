FROM node:lts@sha256:35e3b7fc91f95fc3c9dd76348f7bc5a7aa7525cbf6bc6363333b4c3d6a41e0f4

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]