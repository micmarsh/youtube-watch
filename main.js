
const most = require('@most/core');
const scheduler = require('@most/scheduler');

const yt = require('./youtube');
const pr = require("./peer");


const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('videoId');
const hostId = urlParams.get('hostId')
const peerId = localStorage['myPeerId'];

const player = yt.createPlayer('player', videoId);
const peer = hostId ? pr.connectToHost({hostId, peerId}) : pr.createNewPeer(peerId);

peer.then(data => localStorage['myPeerId'] = data.peerId);

Promise.all([player, peer])
    .then(([player, peer]) => {
        const sendEvents = most.tap(peer.send, player.events);
        const receiveEvents = most.tap(player.trigger, peer.messages);

        const scheduler_ = scheduler.newDefaultScheduler();
        const start = s => most.runEvents(s, scheduler_);

        start(sendEvents);
        start(receiveEvents);
    }, console.error);

window.yt = yt;
window.pr = pr;
