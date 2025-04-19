FROM node:20-alpine

RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
COPY tsconfig.json ./

RUN pnpm install

COPY src/ ./src/

CMD ["pnpm", "run", "prod"]

