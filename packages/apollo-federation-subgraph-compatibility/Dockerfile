FROM node:lts@sha256:146bbe4eaee99ae885be2a0a767f63a4b96032141d70d80e590f10e0d7ebabcb

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]