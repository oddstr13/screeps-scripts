var roles = {
    harvester: require('role.harvester'),
    upgrader: require('role.upgrader'),
    builder: require('role.builder'),
    miner: require('role.miner'),
}

var config = require('config');

module.exports.loop = function () {
    // Memory cleanup
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('💀', name, '👻');
        }
    }

    // Creep spawning
    for (var spawner in Game.spawns) {
        if (Game.spawns[spawner].spawning) {
            var spawningCreep = Game.creeps[Game.spawns[spawner].spawning.name];
            Game.spawns[spawner].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns[spawner].pos.x + 1,
                Game.spawns[spawner].pos.y,
                {align: 'left', opacity: 0.8});

        } else {
            var i = 0;
            for (var unit in config.creeps) {
                var role = config.creeps[unit].role;
                var current = _.filter(Game.creeps, (creep) => creep.memory.unit == unit);
                
                if (current.length < config.creeps[unit].wants) {
                    if ((!config.creeps[unit].condition) || config.creeps[unit].condition(Game.spawns[spawner])) {
                        var newName = Game.spawns['Home'].createCreep(config.creeps[unit].parts, undefined, {role: role, unit:unit});
                        if (typeof newName == "string") {
                            console.log('Spawning new ' + unit + ' (' + role + '): ' + newName);
                        }   
                    }
                }


                Game.spawns[spawner].room.visual.text(
                    config.creeps[unit].icon + ' ' + current.length + '/' + config.creeps[unit].wants,
                    0,
                    i+1,
                    {align: 'left', opacity: 0.8}
                );
                i++;
            }
        }

        // Tower control
        var towers = Game.spawns[spawner].room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_TOWER;
            }
        });
        for (var i in towers) {
            var tower = towers[i];
            if (tower.energy) {
                /*
                var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax
                });
                if (closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
                    continue;
                }*/
                var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if (closestHostile) {
                    tower.attack(closestHostile);
                    continue;
                }

                var damaged = tower.room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax
                });
                var damaged_sorted = _.sortBy(damaged, (structure) => {
                    return structure.hits / structure.hitsMax;
                });
                var most_damaged = damaged_sorted[0];
                if (most_damaged) {
                    tower.repair(most_damaged);
                }


            }
        }
    }

    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (roles[creep.memory.role]) {
            roles[creep.memory.role].run(creep);
        } else {
            if (Game.time % 10 == 0) {
                console.log("Creep `" + name + "` has unknown role `" + creep.memory.role + "`.");
            }
        }
    }
}