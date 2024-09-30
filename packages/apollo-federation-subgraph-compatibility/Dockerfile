FROM node:lts@sha256:db5dd2f30cb82a8bdbd16acd4a8f3f2789f5b24f6ce43f98aa041be848c82e45

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]