var tools = require("tools");

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if (creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if (creep.memory.building) {
            var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if (target) {
                if (creep.build(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                var spawnl = creep.room.find(FIND_MY_SPAWNS, Game.spawns);
                if (spawnl.length) {
                    var spawn = spawnl[0];

                    if (!spawn.memory.roads) {
                        spawn.memory.roads = {};
                    }

                    var targets = creep.room.find(FIND_SOURCES);

                    for (var i in targets) {
                        var target = targets[i];
                        if (!spawn.memory.roads[target.id]) {
                            var path = PathFinder.search(spawn.pos, {pos: target.pos, range: 1}, {plainCost:1, swampCost:1});

                            creep.room.visual.poly(path.path, {stroke:'#ff0000', opacity:1, lineStyle: "dotted"});
                            if (!path.incomplete) {
                                for (var i in path.path) {
                                    creep.room.createConstructionSite(path.path[i], STRUCTURE_ROAD);
                                }
                                spawn.memory.roads[target.id] = true;
                            }

                            //creep.room.findPath(spawn.pos, target.pos, {ignoreCreeps: true, })
                            break;
                        }
                    }
                }
            }
        } else {
            if ((!tools.fetchEnergy(creep)) && (creep.carry.energy>1)) {
                // Fall back to mining when creep has energy and no source found
                // (source is out, let's use the time waiting for something usefull)
                console.log("foobar");
                creep.memory.building = true;
            }
        }
    }
};

module.exports = roleBuilder;