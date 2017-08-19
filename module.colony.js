var config = require('config');
var tools = require('tools');

module.exports = {

    /** @param {Creep} creep **/
    run: function() {
        // Colony memory init
        if (!Memory.colonies) {
            Memory.colonies = {};
            Memory.colonies['5982fd5bb097071b4adbf24a'] = {pos: {x: 13, y: 16, roomName: "W16S32"}, workers:{}}; // TODO: dynamic search
        }

        // Colony memory cleanup
        for (let colony in Memory.colonies) {
            for (let worker in Memory.colonies[colony].workers) {
                if (!Game.creeps[worker]) {
                    delete Memory.colonies[colony].workers[worker];
                }
            }
        }


        for (let roomName in Game.rooms) {

        }

        // FIXME: Spawn is hardcoded.
        for (let colonyId in Memory.colonies) {
            let colony = Memory.colonies[colonyId];
            if (!_.filter(colony.workers, (t) => t == "colony.miner").length) {
                console.log("No miner in colony " + colonyId);
                var newName = Game.spawns.Home.createCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE], undefined, {role:"colony.miner", colony: colonyId});
                if (newName) {
                    console.log("New miner for colony " + colonyId + " spawning: " + newName);
                    colony.workers[newName] = "colony.miner";
                }
            }
            if (colony.storage && (!_.filter(colony.workers, (t) => t == "colony.mule").length)) {
                console.log("No mule in colony " + colonyId);
                var newName = Game.spawns.Home.createCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], undefined, {role:"colony.mule", colony: colonyId, base: Game.spawns.Home.pos.roomName});
                if (newName) {
                    console.log("New mule for colony " + colonyId + " spawning: " + newName);
                    colony.workers[newName] = "colony.mule";
                }
            }

        }
    }
};