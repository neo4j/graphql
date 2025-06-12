FROM node:lts@sha256:2040569338f7a279161576ec5ff332d97ef53f46baf94c85fe06fd3ed81a8f5f

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]