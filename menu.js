var oled = require('oled-i2c-bus')
  , font = require('oled-font-5x7');

var menu = function(opts){
  this.opts = opts;
  this.oled = new oled(opts.bus, this.opts.display);
  this.tabs = {};
  this.tabOrder = [];
  this.currentTab = null;
  this.currentElement = 0;
  this.gpio = opts.gpio;
  this.pins = opts.pins;
  this.last = null;
  return this
}

menu.prototype.draw = function(){
  if(!this.active) return false;
  var elements = this.tabs[this.tabOrder[this.currentTab]].elements;
  var oled = this.oled;
  oled.clearDisplay(false);
  oled.fillRect(0,0,128,11,1,false)
  oled.fillRect(1,1,126,9,0,false)
  oled.setCursor(2,2);
  if(this.last){
    oled.writeString(font,1,"< "+this.tabOrder[this.currentTab],0,false,false);
  }else{
    oled.writeString(font,1,this.tabOrder[this.currentTab],0,false,false);
  }
  elements.forEach(function(element,i){
    oled.setCursor(6,(i+1)*8+4);
    oled.writeString(font,1,element.text,1,false,false);
  });
  oled.setCursor(1,(this.currentElement+1)*8+4);
  oled.writeString(font,1,">",1,false,false);
  oled.update();
  return this;
}

menu.prototype.addElement = function(text,tab,callback){
  if(this.active) return false;
  this.tabs[tab].elements.push({text:text,func:callback});
  return this;
}

menu.prototype.addTab = function(title){
  if(this.active) return false;
  this.tabs[title] = {elements:[]};
  this.tabOrder.push(title);
  return this;
}

menu.prototype.runMenu = function(last){
  if(last){
    this.last = last;
  }else{
    this.last = null;
  }
  this.oled.stopScroll();
  this.currentElement = 0;
  var menu = this;
  console.log(this.tabOrder);
  if(this.tabOrder.length > 0) this.currentTab=0;
  if(this.gpio){
    var gpio = this.gpio;
    gpio.poll(this.pins.up,function(){menu.up()},gpio.POLL_HIGH);
    gpio.poll(this.pins.down,function(){menu.down()},gpio.POLL_HIGH);
    gpio.poll(this.pins.back,function(){menu.back()},gpio.POLL_HIGH);
    gpio.poll(this.pins.next,function(){menu.next()},gpio.POLL_HIGH);
    gpio.poll(this.pins.enter,function(){menu.enter()},gpio.POLL_HIGH);
  };
  this.active = true;
  this.draw();
  return this;
}

menu.prototype.up = function(){
  if(!this.active) return false;
  --this.currentElement
  if(this.currentElement < 0){
    this.currentElement=0;
  }
  this.draw();
  return this;
}

menu.prototype.down = function(){
  if(!this.active) return false;
  ++this.currentElement
  if(this.currentElement > this.tabs[this.tabOrder[this.currentTab]].elements.length - 1){
    this.currentElement=this.tabs[this.tabOrder[this.currentTab]].elements.length - 1;
  }
  this.draw();
  return this;
}

menu.prototype.back = function(){
  if(!this.active) return false;

  if(!this.last){
    if(!this.currentTab) return false;

    --this.currentTab
    if(this.currentTab < 0){
      this.currentTab=0;
    }

    this.currentElement=0;
    this.draw();

  }else{
    this.close();

    this.last.runMenu();
  }

  return this;
}

menu.prototype.next = function(){
  if(!this.active) return false;
  if(typeof this.currentTab != "number") return false;
  if(this.last) return false;

  ++this.currentTab
  if(this.currentTab > this.tabOrder.length - 1){
    this.currentTab=this.tabOrder.length - 1;
  }
  this.currentElement=0;
  this.draw();

  return this;
}

menu.prototype.enter = function(){
  if(!this.active) return false;
  var callback = this.tabs[this.tabOrder[this.currentTab]].elements[this.currentElement].func;
  callback();
  return this;
}

menu.prototype.close = function(){
  if(!this.active) return false;
  console.log("closing menu");
  this.oled.clearDisplay();
  this.oled.update();
  this.active = false;
  if(this.gpio){
    var gpio = this.gpio;
    gpio.poll(this.pins.up,null);
    gpio.poll(this.pins.down,null);
    gpio.poll(this.pins.enter,null);
    gpio.poll(this.pins.back,null);
    gpio.poll(this.pins.next,null);
  };
  return this;
}
  

module.exports = menu;
