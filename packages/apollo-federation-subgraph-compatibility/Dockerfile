FROM node:lts@sha256:d9204281f05b497330fe26b29761e0445707dd9b4e484db73d491e01d47702c3

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]