/*
    ID: 599af6687ba9df39abef8f3a
    Owner:   Bairstow
    Position: 20, 24
    Energy: 820 / 1000
    Hits: 3000 / 3000
*/

var config = require('config');
var tools = require('tools');

var squads_units = {
    tower: {
        tank: {
            body: [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,ATTACK,MOVE,MOVE,MOVE],
            amount: 6,
        },
        ranger: {
            body: [TOUGH,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE],
            amount: 3,
        },
        dummy: {
            body: [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE],
            amount: 8,
        },
    },
    spawn: {
        bee: {
            body: [ATTACK, MOVE, MOVE],
            amount: 1,
        },
    },
}

module.exports = {
    run: function() {
        return;
        if (!Memory.siege) {
            Memory.siege = {targets:{}, squads:{}};
            Memory.siege.targets["599af6687ba9df39abef8f3a"] = {
                pos: {x: 20, y: 24, roomName: "W17S32"},
                type: "tower",
            };
            Memory.siege.targets["59905e4f758cad3344f5c5d9"] = {
                pos: {x:21,y:34,roomName:"W16S31"},
                type: "spawn",
            }
        }
        // Memory cleanup
        for (let squadId in Memory.siege.squads) {
            let squad = Memory.siege.squads[squadId];
            for (let name in squad.troops) {
                if (!Game.creeps[name]) {
                    delete squad.troops[name];
                }
            }
            if (!Object.keys(squad.troops).length) {
                delete Memory.siege.squads[squadId];
            }
        }
        
        for (let targetId in Memory.siege.targets) {
            let target = Memory.siege.targets[targetId];
            if (Game.rooms[target.pos.roomName] && !Game.getObjectById(targetId)) {
                console.log(targetId + " not found in " + target.pos.roomName + ", cleaning...");
                Game.notify(targetId + " not found in " + target.pos.roomName + ", cleaning...");
                delete Memory.siege.targets[targetId];
                continue;
            }
            if (!Memory.siege.squads[targetId]) {
                Memory.siege.squads[targetId] = {troops:{}, ready:false};
                console.log("New squad for target " + targetId);
            }
            let squad = Memory.siege.squads[targetId];
            if (squad.ready) {
                for (let name in squad.troops) {
                    let creep = Game.creeps[name];
                    if (!creep.memory.path)
                    {
                        console.log(name + ": Squad " + targetId + " is moving out!");
                        tools.creepMoveTo(creep, Memory.siege.targets[targetId]);
                    }
                }
            } else {
                let rally = Game.flags["Home.rally"]; // FIXME: hardcoded rally point

                let unitnum = {};
                for (let name in squad.troops) {
                    if (!unitnum[squad.troops[name]]) {
                        unitnum[squad.troops[name]] = 0;
                    }
                    unitnum[squad.troops[name]]++;
                }
                let ready = true;
                for (let unit in squads_units[target.type]) {
                    let num = unitnum[unit] || 0;
                    if (num < squads_units[target.type][unit].amount) {
                        let newName = tools.spawnAnywhere(squads_units[target.type][unit].body, undefined, {role:"siege", squad: targetId, unit: unit});
                        if (typeof newName == "string") {
                            console.log("New squad unit " + unit + " spawned: " + newName);
                            squad.troops[newName] = unit;
                            tools.creepMoveTo(Game.creeps[newName], rally);
                        }
                        ready = false;
                    }
                }
                //console.log(rally);
                //console.log(JSON.stringify(squad));
                
                for (let name in squad.troops) {
                    creep = Game.creeps[name];
                    //console.log(name, creep);
                    if (!creep.pos.inRangeTo(rally.pos, 3)) {
                        ready = false;
                        creep.moveTo(rally.pos);
                    } else if (creep.memory.path) {
                        delete creep.memory.path;
                    }
                    //creep.moveTo(rally.pos);
                }
                squad.ready = ready;
                if (ready) {
                    for (let name in squad.troops) {
                        delete Game.creeps[name].memory.path;
                    }
                }
                return squad.ready;
            }

        }

    }
};