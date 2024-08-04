FROM node:22 AS dev
RUN adduser --disabled-password --comment '' dev && \
    apt-get update && \
    apt-get install sqlite3 && \
    apt-get clean

FROM node:22
WORKDIR /app
ADD package.json package-lock.json .
RUN npm install
ADD server.mjs .
CMD ["/usr/local/bin/node", "server.mjs"]

