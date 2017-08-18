var tools = require("tools");

module.exports = {

    /** @param {Creep} creep **/
    run: function(creep) {
        //console.log("miner");
        if (creep.memory.task == 'mine') {

            if (creep.carryCapacity == _.sum(creep.carry)) {
                creep.memory.task = 'empty';
                delete creep.memory.target;
                //console.log(creep.name + ": I'm full.");

            } else {
                if ((!creep.memory.target) || (!creep.memory.roomName)) {
                    var target = tools.findClosestEnergySource(creep);
                    if (target) {
                        creep.memory.target = {x: target.pos.x, y: target.pos.y, roomName: target.pos.roomName};
                        //console.log("Mining target found: ", target);
                    } else {
                        //console.log("No mining target");
                        return
                    }
                }
                
                var target = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName).lookFor(LOOK_SOURCES)[0];
                //console.log(target);
                //console.log(Object.keys(target));

                if (target) {
                    var res = creep.harvest(target);
                    //console.log(res, ERR_NOT_IN_RANGE);
                    if (res != OK) {
                        creep.moveTo(target.pos, {visualizePathStyle: {stroke: '#ffaa00'}});
                    } else {
                        //console.log("Mining spot in range");
                    }
                }
            }

        } else if (creep.memory.task == 'empty') {

            if (creep.carry.energy == 0) {
                creep.memory.task = 'mine';
                delete creep.memory.target;
                //console.log(creep.name + ": I'm empty.");
            } else {
                if (creep.memory.target == undefined) {
                    var target = tools.findClosestEnergyStorage(creep);
                    //console.log(target);
                    if (target) {
                        creep.memory.target = {x: target.pos.x, y: target.pos.y, roomName: target.pos.roomName};
                        //console.log("Storage target found: ", target);
                    } else {
                        //console.log("No storage target.");
                        return
                    }
                }

                var target = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName).lookFor(LOOK_STRUCTURES)[0];
                if (target) {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target.pos, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        } else {
            creep.memory.task = 'mine';
        }
    }
};
