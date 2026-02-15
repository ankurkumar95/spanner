# Stage 1: Build
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Default nginx config is usually fine for a basic SPA if routed via Nginx proxy in compose
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
