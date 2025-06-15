FROM node:lts@sha256:71bcbb3b215b3fa84b5b167585675072f4c270855e37a599803f1a58141a0716

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]