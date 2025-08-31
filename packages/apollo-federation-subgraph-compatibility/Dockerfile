FROM node:lts@sha256:6fe286835c595e53cdafc4889e9eff903dd3008a3050c1675809148d8e0df805

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]