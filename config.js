module.exports = {
    mapping: true,
    creeps: {
        miner: {
            icon: '⛏️M',
            wants: 3,
            parts: [WORK, WORK, WORK, WORK, CARRY, MOVE],
            role: "miner",
            condition: (spawn) => spawn.room.energyCapacityAvailable >= 550 && spawn.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER}).length,
        },
        harvester: {
            icon: '⛏️H',
            wants: 1,
            parts: [WORK, CARRY, MOVE],
            role: "harvester",
            condition: (spawn) => spawn.room.energyCapacityAvailable < 550,
        },
        harvester2: {
            icon: '⚒️H',
            wants: 3,
            parts: [WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
            role: "harvester",
            condition: (spawn) => spawn.room.energyCapacityAvailable >= 550,
        },
        upgrader: {
            icon: '💡U',
            wants: 2,
            parts: [WORK, CARRY, MOVE],
            role: "upgrader",
            condition: (spawn) => spawn.room.energyCapacityAvailable < 550,
        },
        upgrader2: {
            icon: '🔦U',
            wants: 2,
            parts: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
            role: "upgrader",
            condition: (spawn) => spawn.room.energyCapacityAvailable >= 550,
        },
        builder: {
            icon: '🔨B',
            wants: 1,
            parts: [WORK, CARRY, MOVE],
            role: "builder",
            condition: (spawn) => spawn.room.energyCapacityAvailable < 550 && _.filter(Game.constructionSites, (x) => x.my).length,
        },
        builder2: {
            icon: '🔨B',
            wants: 1,
            parts: [WORK, WORK, WORK, WORK, CARRY, MOVE],
            role: "builder",
            condition: (spawn) => spawn.room.energyCapacityAvailable >= 550 && _.filter(Game.constructionSites, (x) => x.my).length,
        },
        explorer: {
            icon: 'E',
            wants: 0,
            parts: [MOVE, MOVE, MOVE],
            role: "explorer",
        }
    }
};