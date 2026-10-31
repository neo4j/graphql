FROM node:26.12.0@sha256:45a2bf9d9300e9cf47ecb375e38447c140c45ef5fbae869c430475b05b98d86e

WORKDIR /app

COPY ["dist/bundle.js", "./"]

USER node

EXPOSE 4001

CMD [ "node", "bundle.js" ]