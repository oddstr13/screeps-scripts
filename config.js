'use strict';

module.exports = {
    mapping: true,
    mod_colony: true,
    // ⚒️🔦
    creeps: {
        miner: {
            icon: '⛏️M',
            wants: 2,
            parts: [WORK, WORK, WORK, CARRY, MOVE, MOVE],
            weight: 60,
            autosize: true,
            role: "miner",
            condition: (spawn) => spawn.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER}).length,
        },
        harvester: {
            icon: '⛏️H',
            wants: 2,
            weight: 70,
            parts: [WORK, CARRY, MOVE],
            autosize: true,
            role: "harvester",
        },
        upgrader: {
            icon: '💡U',
            wants: 1,
            weight: 20,
            parts: [WORK, CARRY, MOVE],
            role: "upgrader",
            autosize: true,
        },
        builder: {
            icon: '🔨B',
            wants: 2,
            weight: 5,
            parts: [WORK, CARRY, MOVE, MOVE],
            role: "builder",
            autosize: true,
        },
        explorer: {
            icon: '🔦E',
            wants: 0,
            weight: 1,
            parts: [MOVE, MOVE, MOVE],
            role: "explorer",
        },
        logistics: {
            role: "logistics",
            icon: ' L',
            wants: 2,
            weight: 10,
            parts: [CARRY, MOVE],
            autosize: true,
        },
    },
};