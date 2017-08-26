var tools = require("tools");

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if (creep.memory.working && creep.carry.energy == 0) {
            creep.memory.working = false;
            creep.say('🔄 fill');
        }
        if (!creep.memory.working && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
            creep.say('🚧 empty');
        }

        //if (creep.carry.energy < creep.carryCapacity) {
        if (!creep.memory.working) {
            tools.fetchEnergy(creep);
        } else {
            var target;
            if (!target && (creep.room.energyAvailable/creep.room.energyCapacityAvailable>0.55 || creep.room.hostiles.length)) {
                // Prioritize filling towers.
                var towers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.structureType == STRUCTURE_TOWER && structure.energy < (structure.energyCapacity/4)
                });
                if (towers.length) {
                    target = creep.pos.findClosestByPath(towers);
                }
            }
            if (!target) {
                var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION
                            || structure.structureType == STRUCTURE_SPAWN
                            //|| structure.structureType == STRUCTURE_CONTAINER
                        ) && structure.energy < structure.energyCapacity;
                    }
                });
                if (targets.length > 0) {
                    var target = creep.pos.findClosestByPath(targets);
                }
            }
            if (!target) {
                var towers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity
                });
                if (towers.length) {
                    target = creep.pos.findClosestByPath(towers);
                }
            }
            

            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                var roomspawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS, Game.spawns, {filter: (spawn) => spawn.room == creep.room});
                creep.moveTo(roomspawn, {visualizePathStyle: {stroke: '#aaaaaa'}});
            }
        }
    }
};

module.exports = roleHarvester;