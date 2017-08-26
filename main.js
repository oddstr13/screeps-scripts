var config = require('config');
var tools = require('tools');

var roles = {
    builder: require("role.builder"),
    "colony.miner": require("role.colony.miner"),
    "colony.mule": require("role.colony.mule"),
    "colony.sentry": require("role.colony.sentry"),
    explorer: require("role.explorer"),
    harvester: require("role.harvester"),
    miner: require("role.miner"),
    upgrader: require("role.upgrader"),
    siege: require("role.siege"),
    logistics: require("role.logistics"),
}

var modules = {
    colony: require("module.colony"),
    tower: require("module.tower"),
    mapper: require("module.mapper"),
    siege: require("module.siege"),
}


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
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];
        room.hostiles = room.find(FIND_HOSTILE_CREEPS);
    }

    // Creep spawning
    for (let spawnerName in Game.spawns) {
        let spawner = Game.spawns[spawnerName];
        if (!spawner.memory.queue) {
            spawner.memory.queue = [];
        }

        let sorted = _.sortBy(config.creeps, (c)=>c.weight).reverse();
        for (let cc of sorted) {
            //let cc = config.creeps[unit];
            //console.log(JSON.stringify(cc));

            let current = _.filter(Game.creeps, (c) => c.memory.role == cc.role);
            let queued = _.filter(spawner.memory.queue, (c) => c == cc.role).length;

            while ((current.length + queued) < cc.wants) {
                spawner.memory.queue.push(cc.role);
                queued++;
            }
        }

        //console.log(JSON.stringify(spawner.memory.queue));
        let newlist = [];
        for (let cc of sorted) {
            let these = _.remove(spawner.memory.queue, (c) => c==cc.role)
            newlist.push(these);
        }
        //console.log(JSON.stringify(newlist));
        //console.log(JSON.stringify(_.flatten(newlist)));
        spawner.memory.queue = _.flatten(newlist);
        if (spawner.memory.queue) {
            spawner.room.visual.text(spawner.memory.queue.join(','), 13, 36, {align:"left"});
        }

        if (spawner.spawning) {
            let spawningCreep = Game.creeps[spawner.spawning.name];
            spawner.room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                spawner.pos.x + 1,
                spawner.pos.y,
                {align: 'left', opacity: 0.8});

        } else {
            if (spawner.memory.queue) {
                let next = _.first(spawner.memory.queue);
                if (!next) {continue}
                let cc = config.creeps[next];
                if (!cc) {continue}
                console.log(JSON.stringify([next, cc]));
                let cost = _.sum(_.map(cc.parts, (p)=>BODYPART_COST[p]));
                let energyAvailable = spawner.room.energyAvailable;
                let energyCapacity = spawner.room.energyCapacityAvailable;
                
                let body;
                console.log(cc.autosize, energyAvailable,energyCapacity, energyAvailable/energyCapacity, (energyAvailable/energyCapacity)<0.4, Object.keys(Game.creeps).length);
                if (cc.autosize && (energyAvailable/energyCapacity)<0.4 && Object.keys(Game.creeps).length) {
                    continue; // Skip if autosize and energy is less than half capacity
                }
                if (cc.autosize) {
                    let m = Math.floor(energyAvailable / cost);
                    body = [];
                    for (let i=0; i<m; i++) {
                        body = body.concat(cc.parts);
                    }
                    //console.log(JSON.stringify(body));
                } else {
                    body = cc.parts;
                }
                if ((!cc.condition) || cc.condition(spawner)) {
                    let newName = spawner.createCreep(body, undefined, {role: cc.role, unit:unit});
                    if (typeof newName == "string") {
                        spawner.memory.s = Game.time;
                        //console.log("Resizing body; original:", cost, "*", m, "new:", m*cost, "left:", energyAvailable - (m*cost));
                        //console.log(cc.role, "costs:", cost, "available:", energyAvailable, "capacity:", energyCapacity);
                        console.log('Spawning new ' + unit + ' (' + cc.role + '): ' + newName);
                        console.log(JSON.stringify(spawner.memory.queue));
                        spawner.memory.queue = _.rest(spawner.memory.queue);
                        console.log("Removing", next, "from queue.");
                    }   
                }
            }
            
            /*
            if (Game.time % 5 == 0) { // Limit spawning logic to every 10 ticks
                for (let unit in config.creeps) {
                    let cc = config.creeps[unit];
                    let current = _.filter(Game.creeps, (creep) => creep.memory.unit == unit);
                    

                }
            }
            */


            var i = 0;
            for (var unit in config.creeps) {
                var role = config.creeps[unit].role;
                var current = _.filter(Game.creeps, (creep) => creep.memory.unit == unit);

                spawner.room.visual.text(
                    config.creeps[unit].icon || ' ' + ' ' + current.length + '/' + config.creeps[unit].wants,
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
        for (let name in Game.spawns) {
            let spawn = Game.spawns[name];
            
            tools.buildRoad(spawn.pos, spawn.room.controller.pos);

            let sources = spawn.room.find(FIND_SOURCES);
            for (let i in sources) {
                tools.buildRoad(spawn.pos, sources[i].pos);
            }

            let storages = spawn.room.find(FIND_STRUCTURES, {filter:(x)=>x.structureType==STRUCTURE_STORAGE});
            for (let j in storages) {
                tools.buildRoad(spawn.pos, storages[j].pos);
            }

            let minerals = spawn.room.find(FIND_MINERALS);
            for (let i in minerals) {
                tools.buildRoad(spawn.pos, minerals[i].pos);
                for (let j in storages) {
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