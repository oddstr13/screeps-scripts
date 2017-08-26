'use strict';

var config = require('config');
var tools = require('tools');

module.exports = {

    /** @param {Creep} creep **/
    run: function() {
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

                        if (!tools.hasExtendedTime(20)) {
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
    }
};