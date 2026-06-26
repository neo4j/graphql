FROM node:lts@sha256:e9891237dfbb1de60ce19e9ff9fac5d73ad9c37da303ad72ff2a425ad1057e71

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]