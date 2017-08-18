var tools = require("tools");
var config = require("config");

module.exports = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var attacked = 0;
        if (creep.memory.lasthp != creep.hits && creep.hits != creep.hitsMax) {
            attacked = creep.memory.lasthp - creep.hits;
        }
        creep.memory.lasthp = creep.hits;

        if (!Memory.exploring) {
            Memory.exploring = {};
        }
        //console.log(Memory.exploring.current);
        if (!Memory.exploring.current) {
            Memory.exploring.current = creep.pos.roomName;
        }

        var flag = Game.flags[Memory.exploring.current + " center"];

        // Targeting
        if (flag) {
            console.log(flag);
            var exits = Game.map.describeExits(Memory.exploring.current);
            var croom = Game.rooms[Memory.exploring.current];

            if (croom) {
                for (let i in Object.keys(exits)) {
                    if (tools.isExitBlocked(croom, i)) {
                        console.log("Exit to " + exits[i] + " blocked, skipping.");
                        delete exits[i];
                    }
                }
            }

            let next;
            for (let i in exits) {
                if (Game.flags[exits[i] + " center"]) {
                    continue;
                }
                
                next = exits[i];
                console.log("Next room to explore is: " + next);
                break;
            }
            if (!next) {
                next = exits[Object.keys(exits)[tools.randInt(Object.keys(exits).length)]];
                console.log("No unexplored rooms nearby, picking random; " + next);
            }
            if (!next) {
                console.log("Unable to determine where to explore next.");
            } else {
                Memory.exploring.current = next;
            }
        }

        // Movement
        if (Memory.exploring.current != creep.pos.roomName) {
            //console.log(creep.name + ": moving to " + Memory.exploring.current);
            if (tools.isExitBlocked(creep.room, creep.room.findExitTo(Memory.exploring.current))) {
                console.log("Path blocked, aborting...");
                delete Memory.exploring.current;
            } else {
                creep.moveTo(new RoomPosition(25, 25, Memory.exploring.current));
            }
            
        }
    }
}