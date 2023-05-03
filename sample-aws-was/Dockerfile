FROM node:20-alpine
COPY . .
RUN npm i
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]