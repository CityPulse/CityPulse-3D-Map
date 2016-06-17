#!/bin/bash

git clone https://github.com/CityPulse/3DMap.git
mkdir 3DMap_tmp
cd 3DMap_tmp/
git archive --format=tar --remote=ssh://git@bitbucket-server.alexandra.dk:7999/rttdm/3dmap-master.git master | tar -xf - 

#override AMQP's endpoint
cd CityPulseIntegration/
sed -i.bak "s/var amqpEndpoint = .*/var amqpEndpoint = 'amqp:\/\/xpto:xpto@127.0.0.1:8007';/g" amqpclientcallback.js
rm -rf amqpclientcallback.js.bak
cd ..

#mv * ../3DMap
(tar c .) | (cd ../3DMap && tar xf -)
cd ..
rm -rf 3DMap_tmp

# add and push to github
cd 3DMap 
git add .
git commit -m "export from internal repository"
git push origin

# remove dump
cd ..
read -p "Keep pulled repository? (y/n)"
[ "$REPLY" == "y" ] || rm -rf 3DMap


