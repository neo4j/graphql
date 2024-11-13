FROM node:lts@sha256:f496dba5f685ef33797ed5882b4ce209053db67f88b50c1484ecccba6531bfde

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]