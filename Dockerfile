FROM node:latest

WORKDIR /Logistik

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

RUN npm run deploy-migration

EXPOSE 8000

CMD ["npm", "run", "start"]