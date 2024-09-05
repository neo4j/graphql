FROM node:lts@sha256:24da5a5fcd6a01a3d8e2bc0f8401f242850e80a5a4395d56e99d60a469853c22

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]