FROM node:12-slim

WORKDIR /usr/src/whack-a-branch

RUN mkdir -p app/lib
RUN mkdir common
COPY app/package.json app/package-lock.json ./app
ENV NODE_ENV="production"

# Hack so common can load packages as well
ENV NODE_PATH=/usr/src/whack-a-branch/app/node_modules

COPY app/lib app/lib
COPY common ./common

WORKDIR /usr/src/whack-a-branch/app

RUN npm ci --production
RUN npm cache clean --force

CMD [ "npm", "start" ]
