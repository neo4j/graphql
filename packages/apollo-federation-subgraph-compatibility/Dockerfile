FROM node:lts@sha256:909d2840362f35b605ebf4176952b06d02fdcf32971213e5d5ea1090a41097c8

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]