
function getMyPeerId (peer) {
    return localStorage['myPeerId'];
}

function setupConnection(conn){
        conn.on('open', function () {
            console.log("connection opened!");
            conn.on('data', function(data) {
                console.log('Received', data);
                if (data.type === 'pause') {
                    player.pauseVideo();
                }

                if (data.type === 'play') {
                    player.playVideo();
                }

                if (data.type === 'seek') {
                    //todo: if playing, use that other method
                    player.seekTo(data.value);
                }
            });
        });
        conn.on('error', console.error);
}

var urlParams = new URLSearchParams(window.location.search);
var videoId = urlParams.get('videoId');
var hostId = urlParams.get('hostId');

function onYouTubeIframeAPIReady () {
    //this through player creation doesn't actually have anything to
    //do with YT, just here for load timing

    
    var peer;
    var peerId = localStorage['myPeerId'];
    if (peerId){
        peer = new Peer(peerId);
    } else {
        peer = new Peer();
        peer.on('open', function (id ){
            localStorage['myPeerId'] = id;
        });
    }

    setTimeout(function () {
    if (hostId) {
        console.log("connecting to " + hostId);
        var conn = peer.connect(hostId);
        setupConnection(conn);
        window.conn = conn;
    } else {
        console.log("no host id");
        peer.on('connection', function(conn) {
            setupConnection(conn);
            window.conn = conn;
        });
        peer.on('error', console.error);
    }
    }, 2000);

    var player = new YT.Player('player', {
        videoId, // get this from query
        events: {
            'onReady': function () {},
            'onStateChange': function (e) {
                //todo: decomplect this!
                if (e.data === 1) {
                    conn.send({type: 'play'});
                }
                if (e.data === 2) {
                    conn.send({type: 'pause'});
                }
            }
        }});

    var seekCheckMs = 500;
    var lastSeekTime; 
    setInterval(function (){
        if (player && player.getCurrentTime) {
            if (!lastSeekTime) {
                //player will be an arg to future function (also conn, below)
                lastSeekTime = player.getCurrentTime();
            } else {
                var newSeekTime = player.getCurrentTime();
                // 2 is completely arbitrary, just giving a "safe"
                // buffer"
                if (Math.abs(newSeekTime - lastSeekTime) * 1000 > (seekCheckMs * 2)) {
                    conn.send({type: 'seek', value: newSeekTime});
                }
                lastSeekTime = newSeekTime;
            }
        }
    }, seekCheckMs);
    
    window.player = player;
    window.peer = peer;
}
