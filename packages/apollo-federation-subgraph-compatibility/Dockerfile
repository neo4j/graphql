FROM node:lts@sha256:bf0ef0687ffbd6c7742e1919177826c8bf1756a68b51f003dcfe3a13c31c65fe

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]