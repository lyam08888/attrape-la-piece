import fs from 'fs';
import path from 'path';
import assert from 'assert';

const configPath = path.resolve('./config.json');
const assetsDir = path.resolve('./assets');

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const assetFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('player_'));
const assetEntries = Object.entries(config.assets).filter(([key]) => key.startsWith('player_'));

const missingInAssets = assetFiles.filter(file => !assetEntries.some(([, p]) => p.endsWith(file)));
assert.deepStrictEqual(missingInAssets, [], `Missing player assets in config: ${missingInAssets.join(', ')}`);

const animFrames = new Set(Object.values(config.playerAnimations || {}).flat());
const assetKeys = new Set(assetEntries.map(([key]) => key));
const unusedAssets = [...assetKeys].filter(key => !animFrames.has(key));
assert.deepStrictEqual(unusedAssets, [], `Player assets not used in animations: ${unusedAssets.join(', ')}`);

console.log('✅ All player animation assets are referenced and used.');
