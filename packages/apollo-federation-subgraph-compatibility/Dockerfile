FROM node:lts@sha256:50730ab0b271c750c1a29bb4a60aff470e359a60a00fe40379c4747ac1e45796

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]