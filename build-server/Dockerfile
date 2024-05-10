FROM ubuntu:focal

RUN apt update -y
RUN apt install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - 
RUN apt update -y 
RUN apt install -y nodejs

RUN apt install git -y

WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .
RUN npm install

RUN chmod +x main.sh
RUN chmod +x script.js
ENTRYPOINT [ "/home/app/main.sh" ]
