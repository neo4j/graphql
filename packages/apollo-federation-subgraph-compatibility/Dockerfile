FROM node:lts@sha256:b52a8d1206132b36d60e51e413d9a81336e8a0206d3b648cabd6d5a49c4c0f54

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]