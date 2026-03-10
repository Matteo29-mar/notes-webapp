FROM node:22-alpine

WORKDIR /app

# install deps
COPY package*.json ./
RUN npm ci

# copy source
COPY . .

# se hai build TS, abilita:
# RUN npm run build

ENV NODE_ENV=production
EXPOSE 5174

# IMPORTANT: usa uno start "prod" se ce l'hai, altrimenti start normale
# Se hai nodemon in dev, NON usarlo qui.
CMD ["npm", "run", "start"]