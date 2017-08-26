var tools = require("tools");

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        var squad = Memory.siege.squads[creep.memory.squad];

        if (squad.ready) {
            //console.log(JSON.stringify(squad));
            var target = Memory.siege.targets[creep.memory.squad];
            var target_s = Game.getObjectById(creep.memory.squad);

            if (!target) {
                creep.suicide();
                return;
            }

            var body = _.map(_.filter(creep.body, (p)=>p.hits), (p)=>p.type);

            if (Game.rooms[target.pos.roomName]) {
                target_s.room.visual.circle(target_s.pos, {radius:1, stroke:"#000000", fill: "#ff0000", opacity: 0.3});
            }
            //console.log(target_s);
            var ret;

            if (_.includes(body, RANGED_ATTACK)) {
                ret = creep.rangedAttack(target_s);
            } else if (_.includes(body, ATTACK)) {
                ret = creep.attack(target_s);
            }

            //console.log(ret);
            if (target.pos.roomName != creep.pos.roomName || ret == ERR_INVALID_TARGET || ret == ERR_NOT_IN_RANGE) {
                tools.creepMovement(creep);
            }

        }
    }
}