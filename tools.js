'use strict';

var tools = {};


tools.findEnergy = function(creep) {
    //console.log("findEnergy");
    var wanted_energy = creep.carryCapacity - _.sum(creep.carry);
    var res = [];
    //console.log(wanted_energy);
    var x = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            //console.log(structure.structureType);
            return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store.energy/* > wanted_energy*/;
        }
    });
    for (var i in x) {
        res.push(x[i]);
    }

    /*var x = creep.room.find(FIND_SOURCES, {
        filter: (source) => {
            return source.energy > wanted_energy;
        }
    });
    for (var i in x) {
        res.push(x[i]);
    }*/

    var x = creep.room.find(FIND_DROPPED_RESOURCES, {filter: (resource) => {
        return resource.resourceType == RESOURCE_ENERGY;
    }});
    //console.log(x);
    for (var i in x) {
        res.push(x[i]);
    }
    
    return res;
};

tools.findEnergyStorage = function(creep) {
    //console.log("findEnergyStorage");
    return creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            if (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) {
                //console.log(structure, structure.store, structure.storeCapacity);
                //console.log(structure.structureType == STRUCTURE_STORAGE, structure.structureType == STRUCTURE_CONTAINER, structure.energy < structure.energyCapacity);
            }
            
            return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) && _.sum(structure.store) < structure.storeCapacity;
        }
    });
};

tools.findEnergyTarget = function(creep) {
    //console.log("findEnergyTarget");

    return creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_TOWER ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
        }
    });
};

tools.findClosestEnergy = function(creep) {
    var targets = tools.findEnergy(creep);
    //console.log(targets);
    //console.log(JSON.stringify(targets));

    if (targets.length) {
        return creep.pos.findClosestByPath(targets);
    }
};

tools.findClosestEnergyStorage = function(creep) {
    //console.log("findClosestEnergyStorage");
    var targets = tools.findEnergyStorage(creep);

    //console.log('a', targets);
    //console.log('b', JSON.stringify(targets));

    if (targets.length) {
        return creep.pos.findClosestByPath(targets);
    }
};

tools.findClosestEnergyTarget = function(creep) {
    var targets = tools.findEnergyStorage(creep);
    //console.log(JSON.stringify(targets));
    if (targets.length) {
        return creep.pos.findClosestByPath(targets);
    }
};

tools.findClosestEnergySource = function(creep) {
    return creep.pos.findClosestByPath(FIND_SOURCES, {filter: (source) => source.energy});
}

tools.fetchEnergy = function(creep) {
    //console.log("tools.fetchEnergy");

    var source = tools.findClosestEnergy(creep);

    if (source) {
        //console.log(source, typeof source, Object.keys(source), source.resourceType);
        //console.log(source.structureType, source.resourceType);

        var res;
        if (source.structureType) {
            res = creep.withdraw(source, RESOURCE_ENERGY);
        } else if (source.resourceType) {
            res = creep.pickup(source);
        }
        //console.log(res);
        if (res != OK) {
            creep.moveTo(source.pos, {visualizePathStyle: {stroke: '#0000ff'}});
        }
        return true;
    } else {
        var source = tools.findClosestEnergySource(creep);
        if (source) {
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return true;
        }
    }
    return false;
}

function roadbuilder_costmatrix(roomName) {
    var costs = new PathFinder.CostMatrix;
    var room = Game.rooms[roomName];
    if (!room) {
        return false;
    }

    var structures = room.find(FIND_STRUCTURES);
    for (let i in structures) {
        let structure = structures[i];

        if (structure.structureType == STRUCTURE_ROAD || structure.structureType == STRUCTURE_RAMPART) {
            costs.set(structure.pos.x, structure.pos.y, 2);
        } else {
            costs.set(structure.pos.x, structure.pos.y, 255);
        }
    }

    var csites = room.find(FIND_CONSTRUCTION_SITES);
    for (let i in csites) {
        let csite = csites[i];
        if (csite.structureType == STRUCTURE_ROAD || csite.structureType == STRUCTURE_RAMPART) {
            costs.set(csite.pos.x, csite.pos.y, 2);
        } else {
            costs.set(csite.pos.x, csite.pos.y, 255);
        }
    }

    return costs;
}

tools.buildRoad = function(from, to, visualOnly, range=1) {
    var path = PathFinder.search(from, {pos: to, range: range}, {roomCallback: roadbuilder_costmatrix, plainCost:3, swampCost:3});
    var style = "solid";
    if (path.incomplete) {
        style = "dotted";
    }

    var rooms = _.map(_.uniq(path.path, false, (p)=>p.roomName), (p)=>p.roomName);
    //console.log(JSON.stringify(rooms));
    for (let i in rooms) {
        var segment = _.filter(path.path, (p)=>p.roomName==rooms[i]);
        if (Game.rooms[rooms[i]]) {
            Game.rooms[rooms[i]].visual.poly(segment, {stroke:'#ff0000', opacity:1, lineStyle: style});
        }
    }

    //Game.rooms[from.roomName].visual.poly(path.path, {stroke:'#ff0000', opacity:1, lineStyle: style});
    var built = 0;

    if (!visualOnly && !path.incomplete) {
        for (let i in path.path) {
            let pos = path.path[i];
            let road = !!_.filter(pos.lookFor(LOOK_STRUCTURES), (structure) => structure.structureType == STRUCTURE_ROAD).length;
            let construction = !!pos.lookFor(LOOK_CONSTRUCTION_SITES).length;
            if (!(road || construction)) {
                let res = Game.rooms[pos.roomName].createConstructionSite(pos, STRUCTURE_ROAD);
                if (res == OK) {
                    built++;
                } else if (res == ERR_FULL) {
                    return built;
                }
                //console.log(pos.roomName, res);
            }
        }
    }
    return built;
}

tools.multi0 = function(arr, fill=0) {
  var result = [];
  if (arr.length == 1) {
    for (var i = 0; i < arr[0]; i++) {
      result.push(fill);
    }
  } else {
    var children = arr.slice(1);
    for (var i = 0; i < arr[0]; i++) {
      result.push(tools.multi0(children));
    }
  }
  return result;
}

tools.hasTime = function(amount) {
    return Game.cpu.limit - Game.cpu.getUsed() >= amount;
}

tools.hasExtendedTime = function(amount) {
    return _.min([Game.cpu.tickLimit, Game.cpu.bucket]) - Game.cpu.getUsed() >= amount;
}


tools.randInt = function(min, max) {
    if (max == undefined) {
        max = min;
        min = 0;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

tools.isExitBlocked = function(room, exit) {
    console.log(room, exit);
    var res;
    if (exit == FIND_EXIT_TOP) {
        return !!room.lookForAtArea(LOOK_STRUCTURES, 0, 0, 0, 49, true).length;
    } else if (exit == FIND_EXIT_LEFT) {
        return !!room.lookForAtArea(LOOK_STRUCTURES, 0, 0, 49, 0, true).length;
    } else if (exit == FIND_EXIT_RIGHT) {
        return !!room.lookForAtArea(LOOK_STRUCTURES, 0, 49, 49, 49, true).length;
    } else if (exit == FIND_EXIT_BOTTOM) {
        return !!room.lookForAtArea(LOOK_STRUCTURES, 49, 0, 49, 49, true).length;
    } else if (exit < 0) {
        return false;
    }
}

tools.creepmovement_costmatrix = function(roomName) {
    var costs = new PathFinder.CostMatrix;
    var room = Game.rooms[roomName];
    if (!room) {
        return false;
    }

    var structures = room.find(FIND_STRUCTURES);
    for (let i in structures) {
        let structure = structures[i];
        let current = costs.get(structure.pos.x, structure.pos.y);

        if (structure.structureType == STRUCTURE_ROAD || (structure.structureType == STRUCTURE_RAMPART && structure.my)) {
            if (!(current > 1)) {
                costs.set(structure.pos.x, structure.pos.y, 1);
            }
        //} else if (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) {
        //    costs.set(structure.pos.x, structure.pos.y, 255);
        } else if (structure.structureType == STRUCTURE_CONTAINER) {
            if (!(current > 2)) {
                costs.set(structure.pos.x, structure.pos.y, 2);
            }
        } else {
            costs.set(structure.pos.x, structure.pos.y, 255);
        }
    }

    return costs;
}

tools.creepMovement = function(creep) {
    if (creep.memory.path) {
        //console.log(JSON.stringify(creep.memory.path));
        var t = creep.memory.path.t;
        var target = new RoomPosition(t.x, t.y, t.n);
        creep.moveTo(target);
    }
}
function foo()
{
    //delete creep.memory.path;
    // {"role":"siege","squad":"599af6687ba9df39abef8f3a","unit":"tank","_move":{"dest":{"x":26,"y":10,"room":"W16S33"},"time":758753,"path":"21221122222221818","room":"W16S33"}}
    if (creep.memory.path) {
        if (creep.memory.path) {
            var path = creep.memory.path;
            console.log(JSON.stringify(path));
            if (!path.d || !path.p) {
                delete creep.memory.path;
                return false;
            }
            var p = {x: creep.pos.x, y: creep.pos.y, n: creep.pos.roomName};

            if (path.last && path.p.x == p.x && path.p.y == p.y) {
                if (!path.e) {path.e = 0}
                path.e ++;
                if (path.e > 20) {
                    delete creep.memory.path;
                }
                return false;
            } else {
                path.p = p;
                path.d = path.d.substring(1);
            }
            if (creep.fatigue) {
                return true;
            }
            var dir = parseInt(path.d[0]);
            path.last = path.d[0];
            var ret = creep.move(dir);
            if (ret == OK) {
                console.log(ret);
            }
            return true;
        }
    }
}

tools.onEdge = function(pos) {
    if (pos.x == 0 || pos.y == 0 || pos.x == 49 || pos.y == 49) {
        return true;
    }
    return false;
}

tools.creepMoveTo = function(creep, target, range=1) {
    delete creep.memory.path;
    var target = target.pos || target;
    var path = PathFinder.search(creep.pos, {pos: target, range: range}, {roomCallback: creepmovement_costmatrix});
    console.log(JSON.stringify([creep.pos, path.path[0]]));
    var obj = {};
    obj.t = {x: target.x, y: target.y, n: target.roomName};
    obj.p = {x: creep.pos.x, y: creep.pos.y, n: creep.pos.roomName};
    var list = [];
    var last = creep.pos;
    for (let i in path.path) {
        let pos = path.path[i];
        let d = last.getDirectionTo(pos);
        //console.log(last, pos, d);
        list.push(d);
        last = pos;
    }
    obj.d = list.join("");
    creep.memory.path = obj;
    console.log(JSON.stringify(obj));
}

tools.spawnAnywhere = function(body, name, opts) {
    for (let spawner in Game.spawns) {
        if (Game.spawns[spawner].spawning) {
            continue;
        }
        if (Game.spawns[spawner].memory.s == Game.time) {
            continue;
        }
        //console.log(JSON.stringify([body, name, opts, spawner, Game.spawns[spawner].memory, Game.spawns[spawner].memory.queue]));
        if (Game.spawns[spawner].memory.queue.length) {
            continue;
        }

        let newName = Game.spawns[spawner].createCreep(body, name, opts);
        if (typeof newName == "string") {
            console.log(newName + " spawning in " + spawner);
            Game.spawns[spawner].memory.s = Game.time;
            return newName;
        }
    }
    return ERR_BUSY;
}

var ranges = {}
tools.getRange = function(from, to) {
    var res = ranges[from.id+','+to.id];
    if (res == undefined) {
        res = from.pos.getRangeTo(to.pos);
    }
    return res;
}

module.exports = tools;