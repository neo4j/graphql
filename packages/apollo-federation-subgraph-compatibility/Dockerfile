FROM node:lts@sha256:7bf4a586b423aac858176b3f683e35f08575c84500fbcfd1d433ad8568972ec6

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]