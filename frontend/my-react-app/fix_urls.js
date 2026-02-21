const fs = require('fs');
const path = require('path');

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = content.replace(/'https:\/\/simplesocialbackend\.onrender\.com([^']*)'/g, '`${import.meta.env.VITE_API_URL}$1`');
            updated = updated.replace(/"https:\/\/simplesocialbackend\.onrender\.com([^"]*)"/g, '`${import.meta.env.VITE_API_URL}$1`');
            updated = updated.replace(/`https:\/\/simplesocialbackend\.onrender\.com([^`]*)`/g, '`${import.meta.env.VITE_API_URL}$1`');
            if (content !== updated) {
                fs.writeFileSync(fullPath, updated, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}
processDir(path.join(__dirname, 'src'));
