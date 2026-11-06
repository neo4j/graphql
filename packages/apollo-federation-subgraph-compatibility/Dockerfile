FROM node:26.12.1@sha256:97fa0f1b59035c6072721a88d55be1371c7cb1cc942b521e1cc5c72ec87655f4

WORKDIR /app

COPY ["dist/bundle.js", "./"]

USER node

EXPOSE 4001

CMD [ "node", "bundle.js" ]