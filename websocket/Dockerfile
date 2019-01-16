FROM mhart/alpine-node:10
WORKDIR /app
COPY . .
RUN npm install --prod
EXPOSE 8080
ENTRYPOINT ["node", "index.js"]

