/* eslint-disable unicorn/no-process-exit */
import fs from 'fs-extra';
import path from 'node:path';

type ReleaseType = 'stable' | 'beta' | 'nightly';

const version = process.argv[2];
const releaseType = process.argv[3] as ReleaseType;

if (!version || !releaseType) {
  console.error(
    'Missing parameters. Usage: bun run setDesktopVersion.ts <version> <stable|beta|nightly>',
  );
  process.exit(1);
}

if (!['stable', 'beta', 'nightly'].includes(releaseType)) {
  console.error(
    `Invalid release type: ${releaseType}. Must be one of 'stable', 'beta', 'nightly'.`,
  );
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '../..');

const desktopPackageJsonPath = path.join(rootDir, 'apps/desktop/package.json');
const buildDir = path.join(rootDir, 'apps/desktop/build');

function updateAppIcon(type: 'beta' | 'nightly') {
  console.log(`📦 Updating app icon for ${type} version...`);
  try {
    const iconSuffix = type === 'beta' ? 'beta' : 'nightly';
    const iconMappings = [
      { ext: '.png', source: `icon-${iconSuffix}.png`, target: 'icon.png' },
      { ext: '.icns', source: `Icon-${iconSuffix}.icns`, target: 'Icon.icns' },
      { ext: '.ico', source: `icon-${iconSuffix}.ico`, target: 'icon.ico' },
    ];

    for (const mapping of iconMappings) {
      const sourceFile = path.join(buildDir, mapping.source);
      const targetFile = path.join(buildDir, mapping.target);

      if (fs.existsSync(sourceFile)) {
        if (sourceFile !== targetFile) {
          fs.copyFileSync(sourceFile, targetFile);
          console.log(`  ✅ Copied ${mapping.source} to ${mapping.target}`);
        }
      } else {
        console.warn(`  ⚠️ Warning: Source icon not found: ${sourceFile}`);
      }
    }
  } catch (error) {
    console.error('  ❌ Error updating icons:', error);
  }
}

function updatePackageJson() {
  console.log(`⚙️ Updating ${desktopPackageJsonPath} for ${releaseType} version ${version}...`);
  try {
    if (!fs.existsSync(desktopPackageJsonPath)) {
      console.error(`❌ Error: File not found ${desktopPackageJsonPath}`);
      process.exit(1);
    }

    const packageJson = fs.readJSONSync(desktopPackageJsonPath);

    packageJson.version = version;

    switch (releaseType) {
      case 'stable': {
        packageJson.productName = 'AI Assistant';
        packageJson.name = 'lobehub-desktop';
        console.log('🌟 Setting as Stable version.');
        break;
      }
      case 'beta': {
        packageJson.productName = 'AI Assistant-Beta'; // Or 'AI Assistant-Beta' if preferred
        packageJson.name = 'lobehub-desktop-beta'; // Or 'lobehub-desktop' if preferred
        console.log('🧪 Setting as Beta version.');
        updateAppIcon('beta');
        break;
      }
      case 'nightly': {
        packageJson.productName = 'AI Assistant-Nightly'; // Or 'AI Assistant-Nightly'
        packageJson.name = 'lobehub-desktop-nightly'; // Or 'lobehub-desktop-nightly'
        console.log('🌙 Setting as Nightly version.');
        updateAppIcon('nightly');
        break;
      }
    }

    fs.writeJsonSync(desktopPackageJsonPath, packageJson, { spaces: 2 });

    console.log(
      `✅ Desktop app package.json updated successfully for ${releaseType} version ${version}.`,
    );
  } catch (error) {
    console.error('❌ Error updating package.json:', error);
    process.exit(1);
  }
}

updatePackageJson();
