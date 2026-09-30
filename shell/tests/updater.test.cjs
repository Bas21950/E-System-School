const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {EventEmitter} = require('node:events');
const path = require('node:path');

test('Locked download hands off to a visible automatic installer and includes version/notes', () => {
  const updater = new EventEmitter();
  let installArgs;
  updater.quitAndInstall = (...args) => { installArgs = args; };
  updater.setFeedURL = () => {};
  const timers = [];
  const handlers = {};
  const events = [];
  const window = new EventEmitter();
  window.isDestroyed = () => false;
  window.webContents = {send: (channel,details) => events.push({channel,details})};
  for (const fn of ['setClosable','setMinimizable','setMaximizable','setResizable']) window[fn] = value => { window[fn+'Value'] = value; };
  const scope = {module:{exports:{}},process:{env:{}},
    require: name => name === 'electron' ? {app:{isPackaged:true,getVersion:()=> '1.2.10',getPath:()=> 'E:/E-System School/E-System School.exe'},ipcMain:{handle:(channel,fn)=> {handlers[channel]=fn}}} : name === 'electron-updater' ? {autoUpdater:updater} : name === 'electron-log' ? {transports:{file:{}},info(){},error(){}} : require(name),
    setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout(){},setInterval:()=>1,clearInterval(){}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../updater.js'),'utf8'),scope);
  scope.module.exports.setupAutoUpdater(window);
  updater.emit('update-available',{version:'1.2.11',releaseNotes:'Test release'});
  assert.equal(window.setClosableValue,false);
  assert.equal(handlers['update:get-state']().currentVersion,'1.2.10');
  assert.equal(handlers['update:get-state']().version,'1.2.11');
  let prevented = false;
  window.emit('close',{preventDefault(){prevented=true}});
  assert(prevented);
  updater.emit('update-downloaded',{version:'1.2.11'});
  timers.find(t=>t.ms===1200).fn();
  assert.deepEqual(installArgs,[false,true]);
  assert.equal(updater.installDirectory,'E:/E-System School');
  assert(events.some(e=>e.channel==='update:downloaded'));
  updater.emit('error',new Error('installer could not start'));
  prevented=false;
  window.emit('close',{preventDefault(){prevented=true}});
  assert(prevented,'failed installer launch must keep the main screen locked');
});
