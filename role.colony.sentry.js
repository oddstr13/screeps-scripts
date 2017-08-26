var config = require('config');
var tools = require('tools');

module.exports = {

    /** @param {Creep} creep **/
    run: function(creep) {
        //console.log("colony.sentry");
        var enemies = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: (c) => {
                var parts = _.filter(c.body, (p) => _.includes([ATTACK, RANGED_ATTACK, HEAL], p.type));
                //console.log(JSON.stringify(parts));
                return parts.length;
            }
        });
        //console.log(JSON.stringify(enemies));
        if (enemies.length) {
            var closest = creep.pos.findClosestByRange(enemies);
            //console.log(closest);
            var ret = creep.rangedAttack(closest);
            creep.room.visual.circle(closest.pos, {radius:0.8, stroke:"#000000", fill: "#ff0000", opacity: 0.1})
            if (ret == ERR_NOT_IN_RANGE) {
                var path = PathFinder.search(creep.pos, {pos:closest.pos, range:3}, {roomCallback:tools.creepmovement_costmatrix});
                //console.log(JSON.stringify(path));
                creep.room.visual.poly(path.path, {stroke: '#ff0000'});
                creep.moveByPath(path.path);
            }
            return false;
        }
        
        var closestHurt = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => {
                return c.hits < c.hitsMax;
            }
        });
        
        if (closestHurt) {
            if (!creep.pos.inRangeTo(closestHurt.pos, 1)) {
                creep.moveTo(closestHurt.pos, {visualizePathStyle: {stroke: '#777777'}});
                return false;
            }
            creep.heal(closestHurt);
            return false;
        }

        var flag = Game.flags[creep.memory.flag];

        if (creep.room.name != flag.pos.roomName) {
            creep.moveTo(flag.pos, {visualizePathStyle: {stroke: '#777777'}});
            return false;
        }

        if (!creep.pos.inRangeTo(flag.pos, 5)) {
            creep.moveTo(flag.pos, {visualizePathStyle: {stroke: '#777777'}});
            return false;
        }
    }
};