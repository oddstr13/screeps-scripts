var tools = require("tools");

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        /*
        if (creep.memory.task == 'mine') {

            if (creep.carryCapacity == _.sum(creep.carry)) {
                creep.memory.task = 'empty';
                delete creep.memory.target;

            } else {
                if ((!creep.memory.target) || (!creep.memory.roomName)) {
                    var target = tools.findClosestEnergySource(creep);
                    if (target) {
                        creep.memory.target = {x: target.pos.x, y: target.pos.y, roomName: target.pos.roomName};
                    } else {
                        return
                    }
                }
                
                var target = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName).lookFor(LOOK_SOURCES);
                console.log(target);

                if (target) {
                    if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                        console.log(creep.moveTo(target.pos, {visualizePathStyle: {stroke: '#ffaa00'}}));
                    }
                }
            }

        } else if (creep.memory.task == 'empty') {

            if (creep.carry.energy == 0) {
                creep.memory.task = 'mine';
                delete creep.memory.target;
            } else {
                if (creep.memory.target == undefined) {
                    var target = tools.findClosestEnergyStorage(creep);
                    if (target) {
                        creep.memory.target = {x: target.pos.x, y: target.pos.y, roomName: target.pos.roomName};
                    } else {
                        return
                    }
                }

                var target = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName).lookFor(LOOK_STRUCTURES);
                if (target) {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target.pos, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        } else {
            creep.memory.task = 'mine';
        }
        */
        
        if (creep.carry.energy < creep.carryCapacity) {
            tools.fetchEnergy(creep);
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER ||
                        structure.structureType == STRUCTURE_CONTAINER
                    ) && structure.energy < structure.energyCapacity;
                }
            });
            if (targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                var roomspawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS, Game.spawns, {filter: (spawn) => spawn.room == creep.room});
                creep.moveTo(roomspawn, {visualizePathStyle: {stroke: '#aaaaaa'}});
            }
        }
    }
};

module.exports = roleHarvester;