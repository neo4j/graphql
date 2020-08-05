const globalConf = require('../../jest-global.config');

module.exports = {
    ...globalConf,
    roots: ['src'],
    testRegex: '.*.test.ts$',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};
