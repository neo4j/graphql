FROM node:lts@sha256:58644f218c5c29eff294d2049c4f05b16e7c70ea8f9679f51a85926e147f7a43

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]