var config = require('config');
var tools = require('tools');

module.exports = {

    /** @param {Creep} creep **/
    run: function() {
        // Colony memory init
        if (!Memory.colonies) {
            Memory.colonies = {};
            Memory.colonies['5982fd5bb097071b4adbf24a'] = {pos: {x: 13, y: 16, roomName: "W16S32"}, workers:{}}; // TODO: dynamic search
            //Memory.colonies['5982fd4db097071b4adbf07e'] = {pos: {x: 15, y: 5, roomName: "W17S33"}, workers:{}};
            //Memory.colonies['5982fd4db097071b4adbf07f'] = {pos: {x: 12, y: 28, roomName: "W17S33"}, workers:{}};
            //Memory.colonies['5982fd69b097071b4adbf41f'] = {pos: {x: 17, y: 46, roomName: "W15S33"}, workers:{}};
            //Memory.colonies['5982fd69b097071b4adbf41e'] = {pos: {x: 37, y: 24, roomName: "W15S33"}, workers:{}};
            //Memory.colonies['5982fd69b097071b4adbf41a'] = {pos: {x: 3, y: 22, roomName: "W15S32"}, workers:{}};
            //Memory.colonies['5982fd69b097071b4adbf419'] = {pos: {x: 17, y: 16, roomName: "W15S32"}, workers:{}};
            //Memory.colonies[''] = {pos: {x: , y: , roomName: ""}, workers:{}};
        }

        // Colony memory cleanup
        for (let colony in Memory.colonies) {
            for (let worker in Memory.colonies[colony].workers) {
                if (!Game.creeps[worker]) {
                    console.log("Colony cleaning " + worker);
                    delete Memory.colonies[colony].workers[worker];
                }
            }
        }

        for (let flagName in Game.flags) {
            let flag = Game.flags[flagName];
            if (flag.memory.sentries) {
                for (let name in flag.memory.sentries) {
                    if (!Game.creeps[name]) {
                        console.log("Sentry cleaning " + name);
                        delete flag.memory.sentries[name];
                    }
                }
            }
        }

        if ((Game.time+1) % 100 == 0) {
            console.log("colony room roads");
            var rooms = {}
            //console.log(1);
            for (let colonyId in Memory.colonies) {
                let colony = Memory.colonies[colonyId];
                rooms[colony.pos.roomName] = true;
            }
            //console.log(2);
            for (let spawn in Game.spawns) {
                rooms[Game.spawns[spawn].pos.roomName] = true;
            }
            //console.log(3);

            for (let roomName in rooms) {
                let room = Game.rooms[roomName];
                let flag = Game.flags[roomName + " center"];

                if (room && flag) {
                    for (let roomName2 in rooms) {
                        let room2 = Game.rooms[roomName2];
                        let flag2 = Game.flags[roomName2 + " center"];

                        if (room2 && flag2) {
                            if (flag.name == flag2.name) {
                                continue;
                            }

                            if (room2 && flag2) {
                                if (Object.keys(Game.constructionSites).length < 60) {
                                    console.log(flag.name, flag2.name);
                                    tools.buildRoad(flag.pos, flag2.pos, false);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if ((Game.time+2) % 100 == 0) {
            console.log("colony local roads");
            for (let colonyId in Memory.colonies) {
                let colony = Memory.colonies[colonyId];
                let flag = Game.flags[colony.pos.roomName + " center"];
                if (flag) {
                    if (Object.keys(Game.constructionSites).length < 60) {
                        tools.buildRoad(flag.pos, colony.pos, true);
                    }
                }
                
            }
        }


        for (let flagName in Game.flags) {
            let flag = Game.flags[flagName];
            if (_.endsWith(flagName, " center")) {
                let hasColony = false;
                for (let colonyId in Memory.colonies) {
                    let colony = Memory.colonies[colonyId];
                    if (colony.pos.roomName == flag.pos.roomName) {
                        hasColony = true;
                        break;
                    }
                }
                if (hasColony) {
                    if (!flag.memory.sentries) {
                        flag.memory.sentries = {};
                    }
                    if (Object.keys(flag.memory.sentries).length < 2) {
                        var newName = Game.spawns.Home.createCreep([HEAL, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE],
                            undefined, {role:"colony.sentry", flag: flagName}); // RANGED_ATTACK
                        
                        if (typeof newName == "string") {
                            console.log("New sentry for " + flagName + " spawned: " + newName);
                            flag.memory.sentries[newName] = true;
                        }
                    }
                }
            }
        }

        // FIXME: Spawn is hardcoded.
        for (let colonyId in Memory.colonies) {
            let colony = Memory.colonies[colonyId];
            if (!_.filter(colony.workers, (t) => t == "colony.miner").length) {
                //console.log("No miner in colony " + colonyId);
                var newName = Game.spawns.Home.createCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE], undefined, {role:"colony.miner", colony: colonyId});
                if (typeof newName == "string") {
                    console.log("New miner for colony " + colonyId + " spawned: " + newName);
                    colony.workers[newName] = "colony.miner";
                }
            }
            if (colony.storage && (!_.filter(colony.workers, (t) => t == "colony.mule").length)) {
                //console.log("No mule in colony " + colonyId);
                var newName = Game.spawns.Home.createCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], undefined, {role:"colony.mule", colony: colonyId, base: Game.spawns.Home.pos.roomName});
                if (typeof newName == "string") {
                    console.log("New mule for colony " + colonyId + " spawned: " + newName);
                    colony.workers[newName] = "colony.mule";
                }
            }

        }
    }
};