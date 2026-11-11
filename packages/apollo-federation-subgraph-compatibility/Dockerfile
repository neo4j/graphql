FROM node:26.13.0@sha256:438603bbb5cda404b9416f0b5c8026f61501ab911760d861ec28c36b5d675725

WORKDIR /app

COPY ["dist/bundle.js", "./"]

USER node

EXPOSE 4001

CMD [ "node", "bundle.js" ]