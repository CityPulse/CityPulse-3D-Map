# Citypulse Service
## Run
To run locally, simply first install dependancies and then run:
```bash
npm install
npm start
```
## Build
To build the docker image; login, build and push. Remember to change version number!
```bash
docker login docker.alexandra.dk
docker build -t docker.alexandra.dk/3dmapservice:latest  -t docker.alexandra.dk/3dmapservice:1.0.0 .
docker push docker.alexandra.dk/3dmapservice
```
## Deploy
Here are some examples of how to run on a server or your local machine:
```bash
docker run -it --rm --name 3dmapservice -p 8001:8001 docker.alexandra.dk/3dmapservice
docker run -d --name 3dmapservice -p 8001:8001 docker.alexandra.dk/3dmapservice
```
The first one will remove the contaner when you close it - the other will run it as a daemon.
