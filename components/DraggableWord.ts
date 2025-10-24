// This is a TypeScript class that will be used inside a p5.js sketch.
// p5 will be a global object from the script tag in index.html, so we declare it to avoid TS errors.
declare const p5: any;

export class DraggableWord {
  p: any; // p5 instance
  x: number;
  y: number;
  w: number;
  h: number = 40;
  text: string;
  isDragging: boolean = false;
  offsetX: number = 0;
  offsetY: number = 0;
  originalX: number;
  originalY: number;
  theme: 'light' | 'dark';

  constructor(p: any, text: string, x: number, y: number, theme: 'light' | 'dark') {
    this.p = p;
    this.text = text;
    this.theme = theme;
    this.p.textSize(18);
    this.w = this.p.textWidth(this.text) + 20;
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.originalY = y;
  }

  isMouseOver() {
    return (
      this.p.mouseX > this.x &&
      this.p.mouseX < this.x + this.w &&
      this.p.mouseY > this.y &&
      this.p.mouseY < this.y + this.h
    );
  }

  onPressed() {
    if (this.isMouseOver()) {
      this.isDragging = true;
      this.offsetX = this.x - this.p.mouseX;
      this.offsetY = this.y - this.p.mouseY;
    }
  }

  onReleased() {
    this.isDragging = false;
  }

  update() {
    if (this.isDragging) {
      this.x = this.p.mouseX + this.offsetX;
      this.y = this.p.mouseY + this.offsetY;
    }
  }

  display() {
    this.p.stroke(251, 146, 60); // orange-400
    this.p.strokeWeight(2);
    
    const isHover = this.isMouseOver() || this.isDragging;

    if (this.theme === 'dark') {
      this.p.fill(isHover ? 'rgb(55, 65, 81)' : 'rgb(31, 41, 55)'); // gray-700 : gray-800
    } else {
      this.p.fill(isHover ? 'rgb(229, 231, 235)' : 'rgb(243, 244, 246)'); // gray-200 : gray-100
    }

    this.p.rect(this.x, this.y, this.w, this.h, 8);
    this.p.noStroke();
    
    if (this.theme === 'dark') {
      this.p.fill(255); // white text
    } else {
      this.p.fill(17, 24, 39); // gray-900 text
    }
    
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.text(this.text, this.x + this.w / 2, this.y + this.h / 2);
  }
  
  snapTo(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}