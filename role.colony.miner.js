var tools = require("tools");

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        //console.log("colony.miner");
        const ROLE = "colony.miner";
        //console.log(JSON.stringify(creep.memory));
        //console.log(creep.name + ": time " + Game.time);

        if (!creep.memory.colony) {
            for (let colony in Memory.colonies) {
                if (! _.filter(Memory.colonies.workers, (r) => r == ROLE).length) {
                    creep.memory.colony = colony;
                    Memory.colonies[colony].workers[creep.name] = ROLE;
                }
            }
        } else {
            if (creep.memory.task == 'mine') {
                //console.log("mine");
                if (creep.carryCapacity == _.sum(creep.carry)) {
                    creep.memory.task = 'empty';
                    delete creep.memory.target;
                    if (creep.memory.building) {
                        creep.memory.target = {x:creep.memory.building.x, y:creep.memory.building.y, roomName:creep.memory.building.roomName};
                        creep.memory.task = 'build';
                        //console.log("potatoes");
                    }
                    //console.log(creep.name + ": I'm full.");
                    return true; // Re-run this tick

                } else {
                    if ((!creep.memory.target) || (!creep.memory.target.pos)) {
                        var target = Memory.colonies[creep.memory.colony];
                        if (target) {
                            creep.memory.target = {x: target.pos.x, y: target.pos.y, roomName: target.pos.roomName};
                            //console.log("Mining target found: ", target);
                        } else {
                            //console.log("No mining target");
                            return;
                        }
                    }
                    
                    var targetPos = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName);
                    if (creep.pos.roomName != targetPos.roomName) {
                        creep.moveTo(targetPos);
                        return;
                    }
                    
                    var target = targetPos.lookFor(LOOK_SOURCES)[0];
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
                //console.log("empty");

                if (creep.carry.energy == 0) {
                    creep.memory.task = 'mine';
                    delete creep.memory.target;
                    //console.log(creep.name + ": I'm empty.");
                    return true; // Re-run this tick
                }
                //console.log(creep.memory.target);
                if (creep.memory.target == undefined) {
                    var colony = Memory.colonies[creep.memory.colony];

                    var containers = _.filter(creep.room.lookForAtArea(LOOK_STRUCTURES, colony.pos.y-2, colony.pos.x-2, colony.pos.y+2, colony.pos.x+2, true),
                        (s)=>s.structure.structureType == STRUCTURE_CONTAINER);
                    //console.log(JSON.stringify(containers));
                    if (containers.length) {
                        var target = containers[0].structure;
                    }

                    //console.log(target);
                    if (target) {
                        //console.log("Storage target found: ");
                        //console.log(JSON.stringify(target));
                        creep.memory.target = {x: target.pos.x, y: target.pos.y, roomName: target.pos.roomName};
                        colony.storage = target.id;
                        
                    } else {
                        console.log("No target.")
                        //console.log(JSON.stringify(colony));
                        var csites = _.filter(creep.room.lookForAtArea(LOOK_CONSTRUCTION_SITES, colony.pos.y-2, colony.pos.x-2, colony.pos.y+2, colony.pos.x+2, true),
                            (s) => s.constructionSite.structureType == STRUCTURE_CONTAINER);
                        //console.log(colony.pos.y-2, colony.pos.x-2, colony.pos.y+2, colony.pos.x+2);
                        //console.log(JSON.stringify(csites));
                        if (csites.length) {
                            var csite = csites[0].constructionSite
                            creep.memory.task = "build";
                            creep.memory.target = {x: csite.pos.x, y: csite.pos.y, roomName: csite.pos.roomName};
                            return true;
                        } else {
                            if (creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER) == OK) {
                                creep.memory.task = "build";
                                creep.memory.target = {x: creep.pos.x, y: creep.pos.y, roomName: creep.pos.roomName};
                                return true;
                            }
                            for (let range=1;range<=2;range++) {
                                let positions = _.filter(creep.room.lookForAtArea(LOOK_TERRAIN, colony.pos.y-range, colony.pos.x-range, colony.pos.y+range, colony.pos.x+range, true),
                                    (s)=>s.terrain != 'wall');
                                for (let i in positions) {
                                    if (creep.room.createConstructionSite(positions[i], STRUCTURE_CONTAINER) == OK) {
                                        creep.memory.task = "build";
                                        creep.memory.target = {x: positions[i].x, y: positions[i].y, roomName: creep.pos.roomName};
                                        return true;
                                    }
                                }
                            }
                        }
                        //console.log("no storage"); // TODO: check for existing construction sites first
                        return false;
                    }
                }

                var target = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName).lookFor(LOOK_STRUCTURES)[0];
                //console.log(JSON.stringify(target));
                if (target) {
                    if (target.hits < target.hitsMax) {
                        if (creep.repair(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(target.pos, {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                    } else {
                        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(target.pos, {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                    }
                }
                
            } else if (creep.memory.task == 'build') {
                //console.log("build");
                if (!creep.carry.energy) {
                    //console.log("No energy");
                    creep.memory.building = creep.memory.target;
                    delete creep.memory.target;
                    creep.memory.task = 'mine';
                    return true;
                }
                //console.log(JSON.stringify(creep.memory));
                if (!creep.memory.target) {
                    console.log("what?!");
                    return false;
                }

                var target = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName).lookFor(LOOK_CONSTRUCTION_SITES);
                //console.log(JSON.stringify(target));
                if (target.length) {
                    //console.log("constructing");
                    if (creep.build(target[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                } else {
                    creep.memory.task = 'mine';
                    delete creep.memory.target;
                    delete creep.memory.building;
                }
                
            } else {
                creep.memory.task = 'mine';
                return true; // Re-run this tick
            }

        }
    }
};