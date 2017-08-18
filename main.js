var roles = {
    harvester: require('role.harvester'),
    upgrader: require('role.upgrader'),
    builder: require('role.builder'),
    miner: require('role.miner'),
    explorer: require('role.explorer'),
}

var config = require('config');
var tools = require('tools');

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
            if (Game.time % 10 == 0) { // Limit spawning logic to every 10 ticks
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
                }
            }
            var i = 0;
            for (var unit in config.creeps) {
                var role = config.creeps[unit].role;
                var current = _.filter(Game.creeps, (creep) => creep.memory.unit == unit);

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
            if (Game.time % 40 == 0) {
                console.log("Creep `" + name + "` has unknown role `" + creep.memory.role + "`.");
            }
        }
    }

    if (Game.time % 50 == 0) {
        //console.log("testing...");
        for (var name in Game.spawns) {
            var spawn = Game.spawns[name];
            
            tools.buildRoad(spawn.pos, spawn.room.controller.pos);

            var sources = spawn.room.find(FIND_SOURCES);
            for (var i in sources) {
                tools.buildRoad(spawn.pos, sources[i].pos);
            }

            var storages = spawn.room.find(FIND_STRUCTURES, {filter:(x)=>x.structureType==STRUCTURE_STORAGE});
            for (var j in storages) {
                tools.buildRoad(spawn.pos, storages[j].pos);
            }

            var minerals = spawn.room.find(FIND_MINERALS);
            for (var i in minerals) {
                tools.buildRoad(spawn.pos, minerals[i].pos);
                for (var j in storages) {
                    tools.buildRoad(spawn.pos, storages[j].pos);
                }
            }

        }
    }

    if (config.mapping && Game.time % 1 == 0) {
        //console.log(Object.keys(Game.rooms));
        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            if (!Game.flags[room.name + ' center']) {
                console.log("Mapping " + roomName);
                let l;
                let matrix;
                let resume = 0;

                if (room.memory.center && room.memory.center.resume) {
                    console.log("Loading resume data...");
                    l = room.memory.center.items;
                    matrix = room.memory.center.matrix;
                    resume = room.memory.center.resume;
                    console.log("Resuming from " + resume);
                } else {
                    console.log("No resume data.")
                    console.log(JSON.stringify(room.memory.center))
                    room.memory.center = {}
                    l = [];
                    if (room.controller) {
                        l.push(room.controller.pos);
                    }
                    room.find(FIND_SOURCES).forEach((x)=>l.push(x.pos));
                    room.find(FIND_MINERALS).forEach((x)=>l.push(x.pos));

                    console.log(l);
                    room.memory.center.items = l;
                    matrix = tools.multi0([50,50])
                }
                //console.log("ASD " + JSON.stringify(matrix));

                let store = false;

                let terrain = _.filter(room.lookForAtArea(LOOK_TERRAIN, 1, 1, 48, 48, true), (p)=>p.terrain!='wall');

                for (let ti=resume; ti<terrain.length; ti++) {
                    let p = terrain[ti];
                    let pos = room.getPositionAt(p.x, p.y);

                    if (!tools.hasExtendedTime(8)) {
                        console.log("CPU low, storing state. " + Game.cpu.getUsed());
                        store = true;
                        room.memory.center.pos = {x:p.x, y:p.y};
                        room.memory.center.matrix = matrix;
                        room.memory.center.resume = ti;
                        break;
                    }

                    for (let li in l) {
                        x  =l[li];
                        let path = PathFinder.search(x, {pos:pos}, {plainCost:1, swampCost:1});
                        matrix[p.y][p.x] += Math.pow(2, path.path.length);
                    }
                };

                if (store) {
                    break;
                }
                //console.log(JSON.stringify(matrix));

                let min_size = Infinity;
                let min_pos = {};
                for (y in matrix) {
                    for (x in matrix[y]) {
                        if (matrix[y][x] && matrix[y][x] < min_size) {
                            min_size = matrix[y][x];
                            min_pos.x = x;
                            min_pos.y = y;
                        }
                    }
                }

                if (min_pos.x) {
                    console.log(room.name + " center is at " + min_pos.x + ',' + min_pos.y);
                    console.log(min_pos.x, min_pos.y, room.name + ' center');
                    console.log(room.createFlag(new RoomPosition(min_pos.x, min_pos.y, room.name), room.name + ' center'));
                    console.log(min_pos.x);
                    console.log(min_pos.y);
                    console.log(room.name + ' center');
                }

                delete room.memory.center;

                var x = JSON.stringify(matrix)
                //Game.notify(x);
                console.log(x);
            }
        }
    }

    if (!Game.creeps.Explorer) {
        //Game.spawns.Home.createCreep([MOVE,MOVE,MOVE], "Explorer");
    }
    if (Game.creeps.Explorer) {
        Game.creeps.Explorer.moveTo(new RoomPosition(44,1,'W18S32'));
    }
    //console.log(Object.keys(Game.flags));
}