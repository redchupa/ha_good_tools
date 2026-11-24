ARG BUILD_FROM
FROM ${BUILD_FROM}

ENV LANG=C.UTF-8 \
    NODE_ENV=production

# Install Node.js & npm
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Build frontend
COPY web/package.json web/package-lock.json* /app/web/
RUN cd /app/web && npm install --no-audit --no-fund
COPY web/ /app/web/
RUN cd /app/web && npm run build \
    && mkdir -p /app/public \
    && cp -r /app/web/dist/* /app/public/ \
    && rm -rf /app/web

# Install backend dependencies
COPY server/package.json server/package-lock.json* /app/server/
RUN cd /app/server && npm install --omit=dev --no-audit --no-fund
COPY server/ /app/server/

# Copy entrypoint
COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 8099/tcp

CMD ["/run.sh"]
