FROM oven/bun:latest

WORKDIR /app

COPY package*.json ./
RUN bun install

COPY . .

RUN bun build:client

EXPOSE 3000

CMD ["bun", "start"]
