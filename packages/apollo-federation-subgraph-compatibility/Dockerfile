FROM node:lts@sha256:ec09419096c9cb8ff4c6fcf9c7b63332bbecab56d4cb6dcc83d98c180a7cdddf

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]