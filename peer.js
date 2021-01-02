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

// warning: is javascript-y overload
const createNewPeer = (peerId) => {
    const [received, messages] = adapter.createAdapter();
    const peer = new Peer(peerId);
    
    return eventPromise('open') (peer)
        .then(peerId =>
              eventPromise('connection') (peer)
              .then(c => [peerId, c]))
        .then(([peerId, conn]) => {
            setupConnection (received, conn);
            return {
                messages,
                peerId,
                // some dumb "this" business breaking
                send: x => conn.send(x)
            };    
        });
}

const connectToHost = ({peerId, hostId}) => {
    const [received, messages] = adapter.createAdapter();
    const peer = new Peer(peerId);

    return eventPromise('open') (peer)
        .then (peerId => {
            const conn = peer.connect(hostId);
            setupConnection(received, conn);
            return eventPromise('open') (conn)
                .then(_ => [peerId, conn]);
        })
        .then(([peerId, conn]) => {
            return {
                messages,
                peerId,
                send: x => conn.send(x)
            };
        });
};

exports.createNewPeer = createNewPeer;
exports.connectToHost = connectToHost;
