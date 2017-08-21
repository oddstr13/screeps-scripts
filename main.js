var roles = {
    builder: require("role.builder"),
    "colony.miner": require("role.colony.miner"),
    "colony.mule": require("role.colony.mule"),
    "colony.sentry": require("role.colony.sentry"),
    explorer: require("role.explorer"),
    harvester: require("role.harvester"),
    miner: require("role.miner"),
    upgrader: require("role.upgrader"),
}

var modules = {
    colony: require("module.colony"),
    tower: require("module.tower"),
    mapper: require("module.mapper"),
}

var config = require('config');
var tools = require('tools');

module.exports.loop = function () {
    // Memory cleanup
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('💀', name, '👻');
            for (let cn in Game.creeps) {
                Game.creeps[cn].say("✝️ " + name, true);
            }
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
                            var newName = Game.spawns[spawner].createCreep(config.creeps[unit].parts, undefined, {role: role, unit:unit});
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
    }

    // Creep movement
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == undefined) {
            continue;
        }
        if (creep.memory.role && !roles[creep.memory.role]) {
            try {
                console.log("Loading role " + creep.memory.role + "...");
                roles[creep.memory.role] = require('role.' + creep.memory.role);
            } catch (e) {
                console.log("Error loading " + creep.memory.role);
                console.log(e.stack);
            }
        }

        if (roles[creep.memory.role]) {
            for (let i=0; i<10; i++) {
                try {
                    if (! roles[creep.memory.role].run(creep) ) {
                        break;
                    }
                } catch (e) {
                    Game.notify("Creep " + name + " threw an exception: " + e + "\n\nRole: `" + creep.memory.role + "` Pos: " + JSON.stringify(creep.pos) + "\nMemory:" + JSON.stringify(creep.memory) + "\n\n" + e.stack);
                    console.log("Creep " + name + " threw an exception: " + e);
                    console.log(e.stack);
                }
            }
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

    for (let moduleName in modules) {
        //console.log(moduleName);
        let used = Game.cpu.getUsed();

        try {
            modules[moduleName].run();
        } catch (e) {
            console.log("Module " + moduleName + " threw an exception: " + e);
            console.log(e.stack);
            Game.notify("Module " + moduleName + " threw an exception: " + e + '\n\n' + e.stack);
        }

        let delta = Game.cpu.getUsed() - used;
        if (delta > 1) {
            console.log("Module " + moduleName + " used " + delta + " CPU in tick " + Game.time + ".");
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