ARG BUILD_FROM
ARG WEB_STAGE=frontend
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY web/package*.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM scratch AS verified
COPY web-dist/ /build/dist/
FROM ${WEB_STAGE} AS assets

FROM ${BUILD_FROM}
ENV LANG=C.UTF-8 NODE_ENV=production
WORKDIR /app/server
RUN apk add --no-cache nodejs npm
COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server/ ./
COPY --from=assets /build/dist /app/public
COPY run.sh /run.sh
RUN chmod a+x /run.sh
EXPOSE 8099/tcp
CMD ["/run.sh"]
