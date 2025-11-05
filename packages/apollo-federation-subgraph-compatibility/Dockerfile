FROM node:lts@sha256:e5bbac0e9b8a6e3b96a86a82bbbcf4c533a879694fd613ed616bae5116f6f243

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]