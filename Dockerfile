FROM node:current-alpine

WORKDIR /root
COPY . .
RUN npm install
RUN npm run build

FROM node:current-alpine

USER node
WORKDIR /home/node/tamabotchi
COPY --from=0 /root/out .
COPY --from=0 /root/node_modules node_modules

VOLUME /home/node/tamabotchi/books

CMD ["npm", "run", "start"]