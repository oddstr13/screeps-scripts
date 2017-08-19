var tools = require("tools");

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        //console.log(JSON.stringify(creep.memory));
        if (creep.memory.task == "return") {
            if (!_.sum(creep.carry)) {
                creep.memory.task = "fetch";
                return true;
            }

            if (creep.pos.roomName != creep.memory.base) {
                creep.moveTo(new RoomPosition(25, 25, creep.memory.base));
            } else {
                var storage = tools.findEnergyStorage(creep)[0]
                for (var resource in storage.store) {
                    console.log(resource);
                    if (creep.transfer(storage, resource) != OK) {
                        creep.moveTo(storage.pos);
                    }
                    return false;
                }
            }

        } else if (creep.memory.task == "fetch") {
            if (_.sum(creep.carry) == creep.carryCapacity) {
                creep.memory.task = "return";
                return true;
            }
            var colony = Memory.colonies[creep.memory.colony]
            //console.log(JSON.stringify(colony));
            if (creep.pos.roomName != colony.pos.roomName) {
                //delete creep.memory._move
                creep.moveTo(new RoomPosition(25,25,colony.pos.roomName));
            } else {
                if (!colony.storage) {
                    console.log("No storage present for colony " + creep.memory.colony);
                    return false;
                }
                var storage = Game.getObjectById(colony.storage);
                for (var resource in storage.store) {
                    console.log(resource);
                    if (creep.withdraw(storage, resource) != OK) {
                        creep.moveTo(storage.pos);
                    }
                    return false;
                }
            }
        } else {
            creep.memory.task = "return";
            return true;
        }
    }
};