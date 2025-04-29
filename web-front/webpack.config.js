module.exports = (config) => {
  config.watchOptions = {
    ignored: [
      '**/node_modules/**', // String pattern (correct format)
      '**/.git/**', // Another string pattern
      '**/dist/**', // Add other directories as needed
    ],
    aggregateTimeout: 300, // Delay rebuild slightly for batch changes
    followSymlinks: false, // Don't follow symlinks (reduces watched files)
  };
  return config;
};
