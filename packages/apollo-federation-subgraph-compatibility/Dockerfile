FROM node:lts@sha256:8a03de2385cb16c4d76aac30bf86ab05f55f1754a5402dc9039916e8043f019a

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]