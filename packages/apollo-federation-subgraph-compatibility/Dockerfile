FROM node:lts@sha256:a12ce152ab63dbeb232fcbcd0e9fdfbee6e6443d57785915967893ce9e7c58ba

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]