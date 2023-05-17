FROM zenika/alpine-chrome:with-node

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser

WORKDIR /usr/src/app
COPY --chwon=chrome package.json package-lock.json ./
RUN npm install
COPY --chwon=chrome . ./
RUN npm run build
CMD ["node", "/usr/src/app/build/index.js"]