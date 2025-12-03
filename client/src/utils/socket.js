import io from 'socket.io-client';

// conectar al mismo puerto del back
const socket = io('http://localhost:3000');

export default socket;