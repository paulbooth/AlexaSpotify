var express = require('express')
    , bodyParser = require('body-parser')
    , http = require('http')
    , exec = require('child_process').exec
    , SpotifyWebApi = require('spotify-web-api-node')
    , platform = require('os').platform()
    , app = express();

var clientId = process.env.SPOTIFY_CLIENT_ID;
var secret = process.env.SPOTIFY_SECRET;

var spotifyApi = new SpotifyWebApi({
  clientId : clientId,
  clientSecret : secret
});

app.use(bodyParser.json());

app.post('/alexa', function(req, res, next) {
  console.log('WHOOOO');
  console.log(req.body);
  if (!req.body.track) {
    res.send('gotta gimme dat good track.');
    return;
  }
  playTrack(req.body.track, function(error, track) {
    if (error) {
      console.log('error:', error);
      res.send('There was an error playing ' + track.name);
    } else {
      if (track) {
        res.send('We be playing ' + track.name + ' by ' + track.artists.map(function(a) {return a.name;}).join(' and '));
      } else {
        res.send('Could not find ' + req.body.track + ', bro.');
      }
    }
  });
});

app.get('/', function(req, res) {
  console.log('okay a get, cool');
  res.send('hey this place is a secret shhhh');
});
http.createServer(app).listen(process.env.PORT);

function playTrack(track, callback) {
  spotifyApi.searchTracks('track:' + track).then(function(data) {
    if (data.body.tracks.items.length == 0) {
      console.log("dang, no results for " + track);
      callback(null, null);
      return;
    }

    var mostPop = data.body.tracks.items[0];

    console.log("playing: " + mostPop.name + ' by ' + mostPop.artists[0].name);  

    getChromeCommand(mostPop.external_urls.spotify, function(cmd) {
      exec(cmd, function(error, stdout, stderr) {
        error && console.log("the command \"" + cmd + "\" broke " + error);
        callback(error, mostPop);
      });
    });
  }, function (err) {
    console.log('Something went wrong', err);
    callback(err, track);
  });
}

function getChromeCommand(link, callback) {
  if (platform == 'linux') {
    callback('google-chrome ' + link);
    return
  }
  var getTabsCmd = 'chrome-cli list links | grep "play.spotify.com" | egrep -o ":[0-9]+\]" | egrep -o "[0-9]+"';
  exec(getTabsCmd, function(error, stdout, stderr) {
    error && console.log("the grep broke " + error);
    console.log('cmd', stdout)
    if (error || stdout.length == 0) {
      callback('chrome-cli open ' + link);
    } else {
      var cmd = stdout
        .split('\n')
        .filter(function(tab) { return tab.length > 0; })
        .map(function(tab, index, arr) {
          if (index != arr.length - 1) {
            return 'chrome-cli close -t ' + tab + '; ';
          }
            return 'chrome-cli open ' + link; //+ ' -t ' + tab;
        })
        .join('');
      callback(cmd);
    }
  });
}