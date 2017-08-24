var i2c = require('i2c-bus')
  , oled = require('oled-i2c-bus')
  ,font = require('oled-font-5x7');

var menu = function(opts){
  this.opts = opts;
  this.i2cBus = i2c.openSync(opts.bus);
  this.oled = new oled(this.i2cBus, this.opts.display);
  this.elements = [];
  this.currentElement = 0;
  this.gpio = opts.gpio;
  this.pins = opts.pins;
  return this
}

menu.prototype.draw = function(){
  if(!this.active) return false;
  var elements = this.elements;
  var oled = this.oled;
  oled.clearDisplay();
  elements.forEach(function(element,i){
    oled.setCursor(6,i*8+1);
    oled.writeString(font,1,element.text,1,false);
  });
  oled.setCursor(1,this.currentElement*8+1);
  oled.writeString(font,1,">",1,false);
  oled.update();
}

menu.prototype.addElement = function(text,callback){
  if(this.active) return false;
  this.elements.push({text:text,func:callback});
  return this;
}

menu.prototype.runMenu = function(){
  this.oled.stopScroll();
  this.currentElement = 0;
  var menu = this;
  if(this.gpio){
    var gpio = this.gpio;
    gpio.poll(this.pins.up,function(){menu.up()},gpio.POLL_HIGH);
    gpio.poll(this.pins.down,function(){menu.down()},gpio.POLL_HIGH);
    gpio.poll(this.pins.enter,function(){menu.enter()},gpio.POLL_HIGH);
  };
  this.active = true;
  this.draw();
}

menu.prototype.up = function(){
  if(!this.active) return false;
  --this.currentElement
  if(this.currentElement < 0){
    this.currentElement=0;
  }
  this.draw();
}

menu.prototype.down = function(){
  if(!this.active) return false;
  ++this.currentElement
  if(this.currentElement > this.elements.length - 1){
    this.currentElement=this.elements.length - 1;
  }
  this.draw();
}

menu.prototype.enter = function(){
  if(!this.active) return false;
  var callback = this.elements[this.currentElement].func;
  this.oled.clearDisplay();
  this.oled.update();
  this.active = false;
  if(this.gpio){
    var gpio = this.gpio;
    gpio.poll(this.pins.up,null);
    gpio.poll(this.pins.down,null);
    gpio.poll(this.pins.enter,null);
  };
  callback();
}

module.exports = menu;
