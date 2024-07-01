FROM node:lts@sha256:b849bc4078c3e16a38d72749ab8faeacbcc6c3bdb742399b4a5974a89fc93261

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]