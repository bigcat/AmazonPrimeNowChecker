const {app, BrowserWindow, Menu, Tray, ipcMain} = require('electron')
const path = require('path')
const url = require('url')
const switchStockChecker = require('./helpers/switchStockChecker')
const nativeImage = require('electron').nativeImage
const moment = require('moment')
const open = require('opn')
// set up a MacOS native style tray icon
let trayIcon = nativeImage.createFromPath('ui/images/trayIcon.png')
trayIcon.setTemplateImage(true)

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win,
    searching = false,
    zipCode,
    updateTime,
    siteOpened = false,
    lastFound = '',
    webContents


function pollStock() {

  setInterval( () => {
    switchStockChecker.checkStock(zipCode).then( (data) => {
      console.log('Searching ' + zipCode + ' for Nintendo Switch');
      console.log(moment().format() );
      // console.log(JSON.stringify(data))
      if (data.stock.any) {
        // send notification to renderer
        webContents.send('stock-update', data);
        data.stock.Neon && console.log('Yay! Neon is available!');
        data.stock.Neon && !siteOpened && open(data.website.neon);
        data.stock.Grey && console.log('Yay! Grey is available!');
        data.stock.Grey && !siteOpened && open(data.website.grey);
        siteOpened = siteOpened || data.stock.Neon || data.stock.Grey;
        lastFound = Date.now();
        setTimeout(() => {
          siteOpened = false;
        }, 30 * 60 * 1000); // 30 min reset for opening a window
      } else {
        console.log('No Luck yet :(')
      }
    })
    .catch( (err) => {
      console.log('Oh no! Something has gone wrong! ' + JSON.stringify(err) );
    }); //switchStock.checkStock

  }, updateTime * 1000); //setInterval

} //pollStock


// Start the window!!!!
function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 600, height: 400})

  webContents = win.webContents

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'ui', 'electron.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// Data pump from our UI
ipcMain.on('start-checking', (event, arg) => {
  zipCode = arg.zipCode;
  updateTime = arg.updateTime;

  console.log(zipCode + ' @ ' + updateTime + 's')

  pollStock();
});

//app.dock.setBadge('Switch Stock Checker')
app.setName('Switch Stock Checker')
app.dock.setIcon(path.join(__dirname, 'ui', 'images', 'Nintendo_Switch_logo_transparent.png'))
app.setAboutPanelOptions({applicationName: 'Switch Stock'})
app.on('ready', createWindow)

app.on('ready', () => {
  // Start All the Things

  tray = new Tray(trayIcon)
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Item1', type: 'radio'},
    {label: 'Item2', type: 'radio'},
    {label: 'Item3', type: 'radio', checked: true},
    {type: 'separator'},
    {label: 'Exit', role: 'exit', click() { app.quit() }}
  ])

  tray.setToolTip('Amazon Prime Now Switch Stock Checker')
  tray.setContextMenu(contextMenu)
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
