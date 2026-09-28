FROM node:20
 
WORKDIR /app
 
COPY package.json .
RUN npm install
 
COPY . .
 
RUN mkdir -p /app/backend/data && \
    mv /app/backend/db.json /app/backend/data/db.json && \
    ln -s /app/backend/data/db.json /app/backend/db.json
 
EXPOSE 3002
 
CMD ["node", "backend/server.js"]

