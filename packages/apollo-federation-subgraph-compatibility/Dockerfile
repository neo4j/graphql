FROM node:lts@sha256:34af25027ee1b8bffd482ba995ec1e577fbd398db87beb4c60b80c2c9c025127

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]