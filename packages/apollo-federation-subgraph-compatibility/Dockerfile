FROM node:lts@sha256:d7d3eb5b608bd14c2edf4a72709772fe194d5167d8e132377461197b256ee3d5

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]