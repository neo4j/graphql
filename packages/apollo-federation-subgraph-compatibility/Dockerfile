FROM node:lts@sha256:00e9195ebd49985a6da8921f419978d85dfe354589755192dc090425ce4da2f7

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]