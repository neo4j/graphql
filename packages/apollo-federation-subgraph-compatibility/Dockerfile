FROM node:lts@sha256:3b676479124ebdb0348f540e5c8b64f959ec1358cea05080b711d965f5353a34

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]