FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["pnpm", "run", "dev"]
