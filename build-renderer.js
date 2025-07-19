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
      mode: 'production',
      env: {
        NODE_ENV: 'production'
      }
    });

    console.log('Bundling...');
    await bundler.run();
    
    // Fix HTML file paths to be relative
    const htmlPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      console.log('Original HTML snippet:', html.substring(200, 400));
      
      // Make script src paths relative (handle both quoted and unquoted attributes)
      html = html.replace(/src="\/([^"]+)"/g, 'src="./$1"');
      html = html.replace(/href="\/([^"]+)"/g, 'href="./$1"');
      html = html.replace(/src=\/([^\s>]+)/g, 'src=./$1');
      html = html.replace(/href=\/([^\s>]+)/g, 'href=./$1');
      
      console.log('Fixed HTML snippet:', html.substring(200, 400));
      
      fs.writeFileSync(htmlPath, html);
      console.log('✅ Fixed HTML paths to use relative references');
    }
    
    // Remove WebSocket references from built JS files
    const distDir = path.join(__dirname, 'dist');
    const jsFiles = fs.readdirSync(distDir).filter(file => file.endsWith('.js'));
    
    for (const jsFile of jsFiles) {
      const filePath = path.join(distDir, jsFile);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove WebSocket connection attempts
      content = content.replace(/new WebSocket\(['"`]ws:\/\/localhost[^'"`]*['"`]\)/g, 'null');
      content = content.replace(/WebSocket\(['"`]ws:\/\/localhost[^'"`]*['"`]\)/g, 'null');
      content = content.replace(/ws:\/\/localhost[^'"`\s]*/g, '');
      
      fs.writeFileSync(filePath, content);
    }
    
    console.log('✅ Removed WebSocket references for production');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildApp();
