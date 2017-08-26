"use strict";

var config = require('config');
var tools = require('tools');


var tasks = {};

/** 
 * @param {Creep} creep
 * @param {Array<structureType>} types
 * @return {(Structure|undefined)}
 */
function getClosestStructure(creep, types, filter=(s)=>true) {
    let structures = _.sortBy(creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return _.contains(types, s.structureType) && filter(s);
        }
    }), (e) => tools.getRange(creep, e));

    if (structures.length) {
        //console.log(JSON.stringify(structures));
        return structures[0];
    }
}

/** @param {Creep} creep **/
tasks.store = function(creep) {
    if (!_.sum(creep.carry)) {
        creep.memory.task = "collect";
        delete creep.memory.source;
        return true;
    }

    var target;
    if (!target) {
        target = getClosestStructure(creep, [STRUCTURE_TOWER], (s)=>s.energy < (s.energyCapacity/2));
    }
    if (!target && creep.room.storage && creep.room.storage.storeCapacity > _.sum(creep.room.storage.store)) {
        target = creep.room.storage;
    } else if (creep.carry.energy) {
        if (creep.memory.target) {
            target = Game.getObjectById(creep.memory.target);
            if (target.energyCapacity >= target.energy) {
                target = undefined;
            }
        }
        
        if (!target) {
            target = getClosestStructure(creep, [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_LINK], (s)=>s.energy < s.energyCapacity);
        }
        if (!target) {
            target = getClosestStructure(creep, [STRUCTURE_TOWER], (s)=>s.energy < s.energyCapacity);
        }
        if (target) {
            creep.memory.target = target.id;
        }
    }

    if (target) {
        var res;

        for (let type in creep.carry) {
            res = creep.transfer(target, type);
            if (res == OK || res == ERR_NOT_IN_RANGE) {
                break;
            }
        }
        if (res == ERR_NOT_IN_RANGE || res == ERR_INVALID_TARGET) {
            creep.moveTo(target);
        }
    }
};

const TYPE_RESOURCE = "resource";
const TYPE_STRUCTURE = "structure";

/** @param {Creep} creep **/
tasks.collect = function(creep) {
    if (_.sum(creep.carry) >= creep.carryCapacity) {
        creep.memory.task = "store";
        return true;
    }
    if (!creep.memory.source) {
        let dropped = _.sortBy(creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: (e) => tools.getRange(creep, e) < (e.amount - 1)
        }), (e) => tools.getRange(creep, e));

         


        if (dropped.length) {
            // console.log(JSON.stringify(dropped));
            creep.memory.source = dropped[0].id;
            return true;
        } else {
            var closest = getClosestStructure(creep, [STRUCTURE_CONTAINER], (s)=>_.sum(s.store));
            if (closest) {
                creep.memory.source = closest.id;
                return true;
            } else if (_.sum(creep.carry)) {
                creep.memory.task = "store";
                return true;
            }
        }
    } else if (creep.memory.source) {
        var source = Game.getObjectById(creep.memory.source);
        if (!source) {
            delete creep.memory.source;
            return true;
        }
        var type = source.resourceType && TYPE_RESOURCE || TYPE_STRUCTURE;

        let ret = OK;
        if (type == TYPE_RESOURCE) {
            ret = creep.pickup(source);
        } else if (type == TYPE_STRUCTURE) {
            if (!_.sum(source.store)) {
                delete creep.memory.source;
                return true;
            }
            for (let resource in source.store) {
                ret = creep.withdraw(source, resource);
                if (ret != OK) {
                    break;
                }
            }
        }
        if (ret == ERR_NOT_IN_RANGE || ret == ERR_INVALID_TARGET) {
            creep.moveTo(source);
        }
    }
};


module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        if (!creep.memory.task || !tasks[creep.memory.task]) {
            creep.memory.task = "collect";
            delete creep.memory.source;
        }

        if (_.sum(creep.carry) >= creep.carryCapacity) {
            creep.memory.task = "store";
            //delete creep.memory.target;
        }
        var res = true;
        var n = 0;
        while (res && n++ < 5) {
            res = tasks[creep.memory.task](creep);
        }
    }
};