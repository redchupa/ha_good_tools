ARG BUILD_FROM
FROM ${BUILD_FROM}

ENV LANG=C.UTF-8

# Install Node.js & npm
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Build frontend (resolve Linux musl optional deps cleanly without Windows lockfile)
COPY web/package.json /app/web/
RUN cd /app/web && npm install --include=dev --no-audit --no-fund
COPY web/ /app/web/
RUN rm -f /app/web/package-lock.json \
    && cd /app/web && npm run build \
    && mkdir -p /app/public \
    && cp -r /app/web/dist/* /app/public/ \
    && rm -rf /app/web

# Install backend production dependencies
ENV NODE_ENV=production
COPY server/package.json /app/server/
RUN cd /app/server && npm install --omit=dev --no-audit --no-fund
COPY server/ /app/server/

# Copy entrypoint
COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 8099/tcp

CMD ["/run.sh"]
