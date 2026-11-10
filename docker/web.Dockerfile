FROM node:26-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# @feature-bff-start
COPY apps/bff/package.json apps/bff/
# @feature-bff-end
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN pnpm install --frozen-lockfile
COPY . .
ENV VITE_API_BASE_PATH=/api
# @feature-bff-start
RUN pnpm --filter @react-template/bff build
# @feature-bff-end
RUN pnpm --filter @react-template/web build

FROM nginx:1.28-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
