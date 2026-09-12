FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source
COPY frontend/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]