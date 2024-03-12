FROM node:lts@sha256:25145ea9d633087ae1a683e93eb18685b269449d651faac0434364ee0996852f

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]