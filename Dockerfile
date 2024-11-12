FROM node:20.17.0

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

COPY . .
#RUN rm .env

RUN npx prisma generate

EXPOSE 3000

CMD sh -c "npx prisma generate && npx prisma db push && npm run dev"