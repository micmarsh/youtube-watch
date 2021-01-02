
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

const ytApiReady = new Promise(
    (res, rej) =>
        (function checkReady () {
            setTimeout(
                () => {
                    if (Boolean(YT) && Boolean(YT.Player)) {
                        res(YT);
                    } else {
                        checkReady();
                    }
                }
                , 100);
        })()
);

const createPlayer = (domId, videoId) => {
    const [induce, events] = adapter.createAdapter();

    return ytApiReady
        .then(({Player}) => {
            const player = new Player(domId, {
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
            return {
                events,
                trigger: eventHandler(player),
                _player: player
            };
        });
}

exports.createPlayer = createPlayer;

window.scheduler = scheduler;
window.most = most;
window.adpater = adapter;
