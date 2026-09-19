const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.removeMenu(); // Removes the menubar
    win.loadFile('index.html');
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});
