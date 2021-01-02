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
        .then(peerId => {
              const connP = eventPromise('connection') (peer);
              connP.then(conn => setupConnection (received, conn));
              return {
                  messages,
                  peerId,
                  send: x => connP.then(conn => conn.send(x))
              };    
        });
}

const connectToHost = ({peerId, hostId}) => {
    const [received, messages] = adapter.createAdapter();
    const peer = new Peer(peerId);

    return eventPromise('open') (peer)
        .then(peerId => {
            const conn = peer.connect(hostId);
            setupConnection(received, conn);
            const openP = eventPromise('open') (conn);
            return {
                messages,
                peerId,
                send: x => openP.then(() => conn.send(x))
            };
        });
};

exports.createNewPeer = createNewPeer;
exports.connectToHost = connectToHost;
