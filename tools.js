var tools = {

};


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
                    structure.store.energy > wanted_energy;
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
    let costs = new PathFinder.CostMatrix;
    room = Game.rooms[roomName];
    if (!room) {
        return false;
    }

    var structures = room.find(FIND_STRUCTURES);
    for (var i in structures) {
        var structure = structures[i];

        if (structure.structureType == STRUCTURE_ROAD || structure.structureType == STRUCTURE_RAMPART) {
            costs.set(structure.pos.x, structure.pos.y, 3);
        } else {
            costs.set(structure.pos.x, structure.pos.y, 10);
        }
    }

    var csites = room.find(FIND_CONSTRUCTION_SITES);
    for (var i in csites) {
        var csite = csites[i];
        if (csite.structureType == STRUCTURE_ROAD || csite.structureType == STRUCTURE_RAMPART) {
            costs.set(csite.pos.x, csite.pos.y, 3);
        } else {
            costs.set(csite.pos.x, csite.pos.y, 10);
        }
    }

    return costs;
}

tools.buildRoad = function(from, to, visualOnly) {
    var path = PathFinder.search(from, {pos: to, range: 1}, {roomCallback: roadbuilder_costmatrix, plainCost:4, swampCost:4});
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

    if (!visualOnly && !path.incomplete) {
        for (var i in path.path) {
            var pos = path.path[i];
            var road = !!_.filter(pos.lookFor(LOOK_STRUCTURES), (structure) => structure.structureType == STRUCTURE_ROAD).length;
            var construction = !!pos.lookFor(LOOK_CONSTRUCTION_SITES).length;
            if (!(road || construction)) {
                var res = Game.rooms[pos.roomName].createConstructionSite(pos, STRUCTURE_ROAD);
                if (res == ERR_FULL) {
                    return false;
                }
                //console.log(pos.roomName, res);
            }
        }
    }
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

module.exports = tools;