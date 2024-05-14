import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    testEnvironment: 'node',
    roots: ['tests'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    setupFiles: ["dotenv/config"],
    collectCoverage: true,
    verbose: true,
};

export default config;
