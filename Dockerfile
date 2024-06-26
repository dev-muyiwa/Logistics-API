FROM node:latest

WORKDIR /Logistik

COPY package*.json .

RUN npm install

COPY . .

RUN npm run format

RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "start"]