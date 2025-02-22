# base
FROM node:18-alpine as BASE_IMAGE

# Set the working directory inside the container
WORKDIR /backend-app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server source code to the working directory
COPY . .

FROM node:18-alpine as PRODUCTION_IMAGE

WORKDIR /backend-app

COPY package*.json ./

COPY --from=BASE_IMAGE /backend-app /backend-app

RUN npm install --only=production

# Expose port 8080 (assuming your server listens on this port)
EXPOSE 8080

# Command to start the server
CMD ["npm", "start"]
