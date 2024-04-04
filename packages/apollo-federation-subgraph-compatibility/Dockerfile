FROM node:lts@sha256:fe75ec87317c6ead7a4d43e0a8eaeaadf6f8085b706ab547261cbc73c03403fe

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]