const { Parcel } = require('@parcel/core');
const fs = require('fs');
const path = require('path');

async function buildApp() {
  try {
    console.log('Building...');
    
    // Build with Parcel
    const bundler = new Parcel({
      entries: 'public/index.html',
      defaultConfig: '@parcel/config-default',
      distDir: 'dist',
      mode: 'production'
    });

    console.log('Bundling...');
    await bundler.run();
    
    // Fix HTML file paths to be relative
    const htmlPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      // Make script src paths relative
      html = html.replace(/src="\/([^"]+)"/g, 'src="./$1"');
      html = html.replace(/href="\/([^"]+)"/g, 'href="./$1"');
      
      fs.writeFileSync(htmlPath, html);
      console.log('✅ Fixed HTML paths to use relative references');
    }
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildApp();
