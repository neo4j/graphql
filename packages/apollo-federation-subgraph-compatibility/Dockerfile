FROM node:lts@sha256:715ecafe1d62e5d452f7945c32f81733425aba550e40dbf2ba5b9596e73bdb92

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]