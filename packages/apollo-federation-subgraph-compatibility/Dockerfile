FROM node:lts@sha256:5e362bbb5ef4c6f6e2c86a27b7269b3b3e4bd8dba16be18037ee7ee4caa8afc1

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]