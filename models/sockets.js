class Sockets {
    constructor(io) {
        this.io = io;
        this.rooms = {};
        this.socketEvents();
    }

    socketEvents() {
        this.io.on('connection', (socket) => {
            socket.on('join-lobby', ({ nickname }) => {
                socket.nickname = nickname;
                this.io.emit('update-rooms', this.getRoomData());
            });

            socket.on('create-room', ({ nickname }) => {
                const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;
                this.rooms[roomId] = { id: roomId, name: `Room ${Object.keys(this.rooms).length + 1}`, players: [], spectators: [] };
                this.io.emit('update-rooms', this.getRoomData());
            });

            socket.on('join-room', ({ roomId, nickname }) => {
                socket.roomId = roomId;
                if (this.rooms[roomId].players.length < 2) {
                    this.rooms[roomId].players.push(nickname);
                } else {
                    this.rooms[roomId].spectators.push(nickname);
                }
                socket.join(roomId);
                this.io.to(roomId).emit('update-room', this.rooms[roomId]);
            });

            socket.on('leave-room', ({ roomId, nickname }) => {
                this.rooms[roomId].players = this.rooms[roomId].players.filter(p => p !== nickname);
                this.rooms[roomId].spectators = this.rooms[roomId].spectators.filter(s => s !== nickname);
                socket.leave(roomId);
                this.io.to(roomId).emit('update-room', this.rooms[roomId]);
                this.io.emit('update-rooms', this.getRoomData());
            });

            socket.on('disconnect', () => {
                if (socket.roomId) {
                    const { roomId, nickname } = socket;
                    this.rooms[roomId].players = this.rooms[roomId].players.filter(p => p !== nickname);
                    this.rooms[roomId].spectators = this.rooms[roomId].spectators.filter(s => s !== nickname);
                    this.io.to(roomId).emit('update-room', this.rooms[roomId]);
                    this.io.emit('update-rooms', this.getRoomData());
                }
            });
        });
    }

    getRoomData() {
        return Object.values(this.rooms);
    }
}

module.exports = Sockets;
