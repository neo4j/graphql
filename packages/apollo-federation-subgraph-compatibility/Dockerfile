FROM node:lts@sha256:d6ba961be11a08d00369a01dec7566fc8f2dd895a8edd5b983915123f0e81c63

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]