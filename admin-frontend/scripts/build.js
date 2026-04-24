const fs = require('fs');
const path = require('path');
const chalk = require('react-dev-utils/chalk');
const checkRequiredFilesPath = require.resolve('react-dev-utils/checkRequiredFiles');

process.env.GENERATE_SOURCEMAP = process.env.GENERATE_SOURCEMAP || 'false';

require.cache[checkRequiredFilesPath] = {
  id: checkRequiredFilesPath,
  filename: checkRequiredFilesPath,
  loaded: true,
  exports(files) {
    let currentFilePath;

    try {
      files.forEach(filePath => {
        currentFilePath = filePath;
        fs.accessSync(filePath, fs.constants.F_OK);
      });
      return true;
    } catch (err) {
      const dirName = path.dirname(currentFilePath);
      const fileName = path.basename(currentFilePath);
      console.log(chalk.red('Could not find a required file.'));
      console.log(chalk.red('  Name: ') + chalk.cyan(fileName));
      console.log(chalk.red('  Searched in: ') + chalk.cyan(dirName));
      return false;
    }
  }
};

require('react-scripts/scripts/build');
