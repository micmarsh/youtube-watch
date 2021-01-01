const adapter = require('@most/adapter');


function setupConnection(received, conn){
        conn.on('open', function () {
            console.log("connection opened!");
            conn.on('data', received);
        });
        conn.on('error', console.error);
}

const eventPromise = (eventName) => (emitter) =>
      new Promise((resolve, reject) => {
            emitter.on(eventName, resolve);
            emitter.on('error', reject);
        })

const promiseAfter = (ms) => (action) => (input) =>
      new Promise(
          (res, rej) =>
              setTimeout(() => action(input).then(res, rej) , ms)
      )

const delay = promiseAfter(2000);

// warning: is javascript-y overload
const createNewPeer = delay ((peerId) => {
    const [received, messages] = adapter.createAdapter();
    const peer = new Peer(peerId);

    const onConnection = eventPromise('connection') (peer);
    const onPeerId = eventPromise('open') (peer);

    return Promise.all([onConnection, onPeerId])
        .then((result) => {
            const [conn, peerId] = result;
            setupConnection(received, conn);
            return {
                messages,
                peerId,
                // some dumb "this" business breaking
                send: x => conn.send(x)
            };            
        });
})

const connectToHost = delay (({peerId, hostId}) => {
    const [received, messages] = adapter.createAdapter();
    const peer = new Peer(peerId);

    const onPeerId = eventPromise('open') (peer);

    const conn = peer.connect(hostId);
    setupConnection(received, conn);
    const onOpen = eventPromise('open') (conn);
    
    return Promise.all([onPeerId, onOpen])
        .then(([peerId, _]) => {
            return {
                messages,
                peerId,
                send: x => conn.send(x)
            };
        });
});

exports.createNewPeer = createNewPeer;
exports.connectToHost = connectToHost;
