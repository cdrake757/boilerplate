#! /bin/sh
# /etc/init.d/drake
# update these paths so that the script works correctly
NAME=drake.js
SITEROOT=/home/ubuntu/drake
GHOST=/home/ubuntu/ghost
grunt=/usr/bin/grunt
gem=/usr/bin/gem
forever=/usr/bin/forever
npm=/usr/bin/npm
bower=/usr/bin/bower
export PATH=$PATH:/usr/bin/

case "$1" in
  start)
    echo "Starting $NAME"
    cd $SITEROOT
    pwd
    $grunt prod
    $forever start drake.js -p

    ;;
  stop)
    echo "Stopping script $NAME"
    cd $SITEROOT
    $forever stop drake.js -p

    ;;
  reload)
    echo "Compiling $NAME"
    cd $SITEROOT
    $grunt prod
    $forever restart drake.js -p
    
    ;;
  install)
    echo "Beginning Installation for script $NAME"
    cd $SITEROOT
    sudo $npm cache clean
    sudo $npm install
    $bower install --allow-root

    ;;
  list)
    echo "List"
    $forever list
    ;;
  *)
    echo "Usage: /etc/init.d/drake {start|stop|list|reload|install}"
    exit 1
    ;;
esac

exit 0