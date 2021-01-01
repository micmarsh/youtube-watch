
const most = require('@most/core');
const adapter = require('@most/adapter');

//todo-msm remove this once debugging is over
const scheduler = require('@most/scheduler');

const seekCheckMs = 500;

const eventHandler = (player) => (data) => {
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
}

const setupSeekEvents = (player, induce) => {
    var lastSeekTime; 
    setInterval(function (){
        if (!player.getCurrentTime){
            return;
        }

        //todo-msm true "time" event with this kind of filtering
        //elsewhere??? (yes)
        if (!lastSeekTime) {
            lastSeekTime = player.getCurrentTime();
        } else {
            var newSeekTime = player.getCurrentTime();
            // 2 is completely arbitrary, just giving a "safe buffer"
            if (Math.abs(newSeekTime - lastSeekTime) * 1000 > (seekCheckMs * 2)) {
                induce({type: 'seek', value: newSeekTime});
            }
            lastSeekTime = newSeekTime;
        }
    }, seekCheckMs);
}

const createPlayer = (domId, videoId) => {
    const [induce, events] = adapter.createAdapter();
    
    return new Promise(
        (resolve, reject) =>
            (function createPlayer () {
                setTimeout(
                    () => {
                        if (Boolean(YT) && Boolean(YT.Player)) {                                  
                            var player = new YT.Player(domId, {
                                videoId,
                                events: {
                                    'onReady': () => {},
                                    'onStateChange': (e) => {
                                        if (e.data === 1) {
                                            induce({type: 'play'});
                                        }
                                        if (e.data === 2) {
                                            induce({type: 'pause'});
                                        }
                                    }
                                }});
                            setupSeekEvents(player, induce);
                            resolve({
                                events,
                                trigger: eventHandler(player),
                                _player: player
                            });
                        } else {
                            createPlayer();
                        }
                    }
                    , 100);
            })());
}

exports.createPlayer = createPlayer;

window.scheduler = scheduler;
window.most = most;
window.adpater = adapter;
