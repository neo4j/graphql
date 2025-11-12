FROM node:lts@sha256:42ce5b9cfa5e702563763f93342b8a67de0962fe31098e0344136a95b1d21225

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]