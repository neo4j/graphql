FROM node:lts@sha256:33cf7f057918860b043c307751ef621d74ac96f875b79b6724dcebf2dfd0db6d

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]