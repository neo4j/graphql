FROM node:lts@sha256:f6723dbbf1e45514d53944acff25086259d9ad0d04d20ca16979109dcd807012

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]