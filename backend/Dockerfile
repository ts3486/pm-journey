# syntax=docker/dockerfile:1.7
ARG RUST_VERSION=1.88

FROM rust:${RUST_VERSION}-slim AS chef
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends pkg-config libssl-dev ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN cargo install cargo-chef
COPY backend/ backend/
WORKDIR /app/backend
RUN cargo chef prepare --recipe-path recipe.json

FROM rust:${RUST_VERSION}-slim AS builder
WORKDIR /app
ENV SQLX_OFFLINE=true
RUN apt-get update \
    && apt-get install -y --no-install-recommends pkg-config libssl-dev ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN cargo install cargo-chef
WORKDIR /app/backend
COPY --from=chef /app/backend/recipe.json ./recipe.json
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/backend/target \
    cargo chef cook --release --recipe-path recipe.json
COPY backend/ .
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/backend/target \
    cargo build --release && \
    cp /app/backend/target/release/backend /usr/local/bin/backend

FROM debian:12-slim AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/bin/backend /usr/local/bin/backend
EXPOSE 3001
ENV RUST_LOG=info
CMD ["/usr/local/bin/backend"]
