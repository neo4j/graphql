FROM node:lts@sha256:db556c2974040f7812c7f39c15afb1e8b1901d6e23f1975ff71b5236a1244e52

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]