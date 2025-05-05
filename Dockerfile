FROM node:20.10 AS BUILD_IMAGE

# Install system dependencies required by the canvas package
RUN apt-get update && apt-get install -y \
    libcairo2 libcairo2-dev \
    libjpeg-dev libpango1.0-dev \
    libgif-dev \
    python3 python3-pip \
    build-essential g++ \
    && rm -rf /var/lib/apt/lists/*

# install node-prune
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

WORKDIR /work

COPY . /work/

# install 
RUN npm install 

# build
RUN npm run build

# remove development dependencies
RUN npm prune --production

# run node prune
RUN /usr/local/bin/node-prune

FROM node:20.10-alpine

# add ffmpeg
RUN apk add  --no-cache ffmpeg tzdata

ENV TOKEN=$TOKEN 
# ENV CRON_SCHEDULE="*/1 * * * *"
ENV CRON_SCHEDULE="*/15 * * * *"
ENV CRON_SCHEDULE_TIMELAPSE="0 7 * * *"

WORKDIR /app

# copy from build image
COPY --from=BUILD_IMAGE /work/dist ./dist
COPY --from=BUILD_IMAGE /work/node_modules ./node_modules
COPY --from=BUILD_IMAGE /work/package.json .

# Create the cron log
RUN touch /var/log/cron.log

# Setup our start file
COPY ./cron/run.sh /tmp/run.sh
RUN chmod +x /tmp/run.sh 

# Set time zone
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

CMD ["/tmp/run.sh"]
