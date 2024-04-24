FROM node:lts@sha256:1de802fdf24ea1b1b5dddb5bbd17049708e61226c9753879360d056298fd5c66

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]