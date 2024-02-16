FROM node:lts@sha256:889939e2d0a6b15c1b30c7887bf8908a69a0a41fe5ef835132818f8215c78b03

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]