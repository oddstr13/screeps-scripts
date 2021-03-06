
module.exports = {

    /** @param {Creep} creep **/
    run: function() {
        // Creep spawning
        for (var spawner in Game.spawns) {
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
                    var closestHostile = tower.pos.findClosestByRange(tower.room.hostiles);
                    if (closestHostile) {
                        tower.attack(closestHostile);
                        continue;
                    }

                    var closestHurt = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: (c) => {
                            return c.hits < c.hitsMax;
                        }
                    });

                    if (closestHurt) {
                        tower.heal(closestHurt);
                        continue;
                    }


                    var damaged = tower.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.hits < structure.hitsMax;
                        }
                    });
                    var damaged_sorted = _.sortBy(damaged, (structure) => {
                        // Prioritize very low  durability
                        /*
                        if (structure.hits <= 200) {
                            return 0;
                        }
                        return structure.hits / structure.hitsMax;
                        */
                        return structure.hits;
                    });
                    var most_damaged = damaged_sorted[0];
                    if (most_damaged) {
                        if (most_damaged.hits < 50000 || (tower.energy > (tower.energyCapacity/2))) {
                            tower.repair(most_damaged);
                            continue;
                        }
                    }
                }
            }
        }

    }
};