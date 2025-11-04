FROM node:lts@sha256:69698ef3aab175793435b78d835d317a9f594559666213c96f7f6c694f9d52b7

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]