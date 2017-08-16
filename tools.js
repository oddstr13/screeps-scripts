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
                    structure.structureType == STRUCTURE_CONTAINER) && structure.store.energy < structure.storeCapacity;
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
    return creep.pos.findClosestByPath(FIND_SOURCES, {
        filter: (source) => {
            return source.energy;
        }
    });
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
    } else {
        var source = tools.findClosestEnergySource(creep);
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }
}

module.exports = tools;