// Replace your build section in vite.config.ts
build: {
  rollupOptions: {
    input: {
      main: path.resolve(__dirname, 'index.html'),
      content: path.resolve(__dirname, 'contentScript.ts'),
    },
    output: {
      entryFileNames: (chunkInfo) => {
        return chunkInfo.name === 'content' ? 'contentScript.js' : '[name].js';
      }
    }
  }
}
