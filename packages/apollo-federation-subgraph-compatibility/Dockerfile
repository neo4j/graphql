FROM node:lts@sha256:a4d1de4c7339eabcf78a90137dfd551b798829e3ef3e399e0036ac454afa1291

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]