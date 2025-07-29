FROM node:lts@sha256:37ff334612f77d8f999c10af8797727b731629c26f2e83caa6af390998bdc49c

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]