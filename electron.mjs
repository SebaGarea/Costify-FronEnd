import { app, BrowserWindow } from 'electron';
import path from 'path';

let win; // Mantén la referencia

function createWindow() {
  console.log("Creando ventana Electron...");
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});