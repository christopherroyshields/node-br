FROM node:10-alpine

COPY --from=brulescorp/br:scratch . /

RUN apk update && apk add \
  git \
  build-base \
  python \
  bash

COPY . /

WORKDIR /app
RUN npm i

EXPOSE 9229 3000

CMD ["node","api.js"]
