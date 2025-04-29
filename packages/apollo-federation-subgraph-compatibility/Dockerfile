FROM node:lts@sha256:c9397a508192cf0c591e1923fe88d7dad25c586cf5fa73ce4b8889427747f230

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]