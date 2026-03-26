FROM node:lts@sha256:5a593d74b632d1c6f816457477b6819760e13624455d587eef0fa418c8d0777b

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]