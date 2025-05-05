// Copyright (c) Wictor Wilén. All rights reserved.
// Licensed under the MIT license.

import { mkdirSync, existsSync } from 'fs';
import { RingApi } from 'ring-client-api';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as lodash from 'lodash';
import sharp from 'sharp';
import text2png from 'text2png';

const log = console.log;

const snapshot = async (): Promise<void> => {
    log("running snapshot");

    const ringApi = new RingApi({
        refreshToken: process.env.TOKEN as string,
        debug: true
    });

    const cameras = await ringApi.getCameras();

    const targetBase = path.resolve(__dirname, "target");

    if (!existsSync(targetBase)) {
        log("creating target directory");
        mkdirSync(targetBase);
    }

    for (const camera of cameras) {
        const name = lodash.camelCase(camera.name);
        log(`Retrieving snapshot for ${camera.name}`);

        try {
            const result = await camera.getSnapshot();

            const camDir = path.resolve(targetBase, name);
            if (!existsSync(camDir)) {
                mkdirSync(camDir);
            }

            const timestamp = new Date().toLocaleString();
            const timestampImage = text2png(timestamp, {
                font: '20px sans-serif',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: 5
            });

            const outputPath = path.resolve(camDir, `${Date.now()}.png`);

            await sharp(result)
                .composite([
                    {
                        input: timestampImage,
                        gravity: 'southeast'
                    }
                ])
                .toFile(outputPath);

            log(`Snapshot for ${camera.name} saved with timestamp`);
        } catch (err) {
            log(`Snapshot error: ${err}`);
        }
    }
};

dotenv.config();

snapshot()
    .then(() => {
        log("done");
        process.exit(0);
    })
    .catch(err => {
        log(err);
        process.exit(1);
    });

