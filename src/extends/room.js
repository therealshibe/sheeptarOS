Room.getCells = function () {
    if (!Memory.cellList || Object.keys(Memory.cellList).length < 0) {
        Memory.cellList = {};
        for (let roomname of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomname];
            if (room.controller && room.controller.my) {
                Memory.cellList[roomname] = {};
            }
        }
    }

    return Object.keys(Memory.cellList);
};

Room.removeCell = function(roomname) {
    if (Memory.cellList &&  Memory.cellList[roomname]) {
        delete Memory.cellList[roomname];
        Logger.log(`Removing cell ${roomname}`);
    }
};

Room.prototype.queueCreep = function (role, options = {}) {
    const name = (role + '_' + (new Date().getTime())).toString();

    if (!options.priority) {
        options.priority = SPAWN_DEFAULT_PRIORITY;
    }

    if (!Memory.spawnqueue) {
        Memory.spawnqueue = {};
    }

    if (!Memory.spawnqueue.index) {
        Memory.spawnqueue.index = {};
    }

    if (!Memory.spawnqueue.index[this.name]) {
        Memory.spawnqueue.index[this.name] = {};
    }
    options.role = role;
    Memory.spawnqueue.index[this.name][name] = options;
    return name;
};

Room.prototype.isQueued = function (name) {
    if (!Memory.spawnqueue || !Memory.spawnqueue.index || !Memory.spawnqueue.index[this.name]) {
        return false;
    }
    if (Memory.spawnqueue.index[this.name][name]) {
        return true;
    }
    return !!this.queued && this.queued.indexOf(name) >= 0;
};

// This version can be called without an object having to be created
Room.isQueued = function (name) {
    if (!Memory.spawnqueue || !Memory.spawnqueue.index) {
        return false;
    }
    const spawnrooms = Object.keys(Memory.spawnqueue.index);
    for (let room of spawnrooms) {
        if (Game.rooms[room] && Game.rooms[room].isQueued(name)) {
            return true;
        }
    }
    return false;
};

Room.prototype.getQueuedCreep = function() {
    if (!Memory.spawnqueue || !Memory.spawnqueue.index || !Memory.spawnqueue.index[this.name]) {
        return false;
    }

    const creeps = Object.keys(Memory.spawnqueue.index[this.name]);
    if (creeps.length < 1) {
        return false;
    }

    const that = this;
    creeps.sort(function (a, b) {
        const aP = Memory.spawnqueue.index[that.name][a].priority ? Memory.spawnqueue.index[that.name][a].priority : SPAWN_DEFAULT_PRIORITY;
        const bP = Memory.spawnqueue.index[that.name][b].priority ? Memory.spawnqueue.index[that.name][b].priority : SPAWN_DEFAULT_PRIORITY;
        return aP - bP;
    });

    const options = Memory.spawnqueue.index[this.name][creeps[0]];
    const role = Creep.getRole(options.role);
    options.build = role.getBuild(this, options);
    options.name = creeps[0];

    if (!this.queued) {
        this.queued = [];
    }
    this.queued.push(options.name);
    delete Memory.spawnqueue.index[this.name][creeps[0]];
    return options;
};