import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';

function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function HSLToRGB(h, s, l) {
  // Must be fractions of 1
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}

function RGBToHSL(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;
  if (delta == 0) h = 0;
  // Red is max
  else if (cmax == r) h = ((g - b) / delta) % 6;
  // Green is max
  else if (cmax == g) h = (b - r) / delta + 2;
  // Blue is max
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  // Make negative hues positive behind 360°
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Multiply l and s by 100
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return [h, s, l];
}

@Component({
  selector: 'color-changer-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';
  @ViewChild('fileInput', { static: true }) public fileInputElement: ElementRef<
    HTMLInputElement
  >;
  @ViewChild('canvas', { static: true }) public canvasElement: ElementRef<
    HTMLCanvasElement
  >;
  @ViewChild('colorPointCanvas', { static: true })
  public colorPointCanvasElement: ElementRef<HTMLCanvasElement>;
  @ViewChild('angleCanvas', { static: true })
  public angleCanvasElement: ElementRef<HTMLCanvasElement>;
  public inputStartAngle = 150;
  public inputEndAngle = 270;

  public onFileChanged() {
    const file: Blob = this.fileInputElement.nativeElement.files[0];
    const fr = new FileReader();
    fr.onload = () => {
      this.createImage(fr);
    };
    fr.readAsDataURL(file);
  }

  public ngOnInit() {
    this.initAngleCanvas();
    this.initAngleControl();
  }

  private initAngleCanvas() {
    const angleCtx = this.angleCanvasElement.nativeElement.getContext('2d');
    let borderCircle = new Path2D();
    borderCircle.arc(100, 100, 95, 0, 2 * Math.PI, false);
    angleCtx.strokeStyle = '#666666';
    angleCtx.fillStyle = '#666666';
    angleCtx.stroke(borderCircle);
    let inputStartAngleRad = (this.inputStartAngle * Math.PI) / 180;
    let inputEndAngleRad = (this.inputEndAngle * Math.PI) / 180;
    let selectedSector = new Path2D();
    selectedSector.moveTo(100, 100);
    selectedSector.lineTo(
      100 + 95 * Math.sin(inputStartAngleRad),
      100 - 95 * Math.cos(inputStartAngleRad)
    );
    selectedSector.arc(
      100,
      100,
      95,
      inputStartAngleRad - Math.PI / 2,
      inputEndAngleRad - Math.PI / 2
    );
    selectedSector.lineTo(100, 100);
    angleCtx.stroke(selectedSector);
    angleCtx.fill(selectedSector);
  }

  private initAngleControl() {
    const mouseEventToCoordinate = (mouseEvent: MouseEvent) => {
      mouseEvent.preventDefault();
      const offset = this.getOffset(this.angleCanvasElement.nativeElement);
      return {
        x: mouseEvent.clientX - offset.left,
        y: mouseEvent.clientY - offset.top
      };
    };

    const touchEventToCoordinate = (touchEvent: TouchEvent) => {
      touchEvent.preventDefault();
      const offset = this.getOffset(this.angleCanvasElement.nativeElement);
      return {
        x: touchEvent.changedTouches[0].clientX - offset.left,
        y: touchEvent.changedTouches[0].clientY - offset.top
      };
    };

    const element = this.angleCanvasElement.nativeElement;
    const mouseDown$ = fromEvent(element, 'mousedown').pipe(
      map(mouseEventToCoordinate)
    );
    const mouseMove$ = fromEvent(element, 'mousemove').pipe(
      map(mouseEventToCoordinate)
    );
    const mouseUp$ = fromEvent(element, 'mouseup').pipe(
      map(mouseEventToCoordinate)
    );
    const mouseLeave$ = fromEvent(element, 'mouseleave').pipe(
      map(mouseEventToCoordinate)
    );
    const mouseUpAndLeave$ = merge(mouseUp$, mouseLeave$);
    const touchStart$ = fromEvent(element, 'touchstart').pipe(
      map(touchEventToCoordinate)
    );
    const touchMove$ = fromEvent(element, 'touchmove').pipe(
      map(touchEventToCoordinate)
    );
    const touchEnd$ = fromEvent(element, 'touchend').pipe(
      map(touchEventToCoordinate)
    );
    const start$ = merge(mouseDown$, touchStart$);
    const move$ = merge(mouseMove$, touchMove$);
    const end$ = merge(mouseUpAndLeave$, touchEnd$);
    start$
      .pipe(switchMap(() => move$.pipe(takeUntil(end$))))
      .subscribe(console.log);
  }

  private createImage(fr: FileReader) {
    const img = new Image();
    img.onload = () => {
      this.imageLoaded(img);
    };
    img.src = fr.result as string;
  }

  private imageLoaded(img: HTMLImageElement) {
    const canvas = this.canvasElement.nativeElement;
    canvas.width = img.width; // set canvas size big enough for the image
    canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0); // draw the image
    let imageData: ImageData;
    imageData = ctx.getImageData(0, 0, img.width, img.height);

    const data = imageData.data;
    length = data.length;
    let i = -4;
    const colors: Record<
      string,
      {
        rgb: [number, number, number];
        hsl: [number, number, number];
        count: number;
      }
    > = {};
    while ((i += 1 * 4) < length) {
      const rgb: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
      const key = rgb.join(',');
      if (colors[key]) {
        colors[key].count += 1;
      } else {
        colors[key] = { rgb, hsl: RGBToHSL(...rgb), count: 1 };
      }
    }
    const reducedColors = {};
    const colorPointCanvas = this.colorPointCanvasElement.nativeElement;
    const colorPointCtx = colorPointCanvas.getContext('2d');
    Object.entries(colors).forEach(([k, v]) => {
      if (v.count > 500 && v.hsl[1] > 10 && v.hsl[2] < 90) {
        reducedColors[k] = v;
        const r = 70 * Math.random() + 20;
        let circle = new Path2D();
        const angleRad = (v.hsl[0] * Math.PI) / 180;
        circle.arc(
          100 + r * Math.sin(angleRad),
          100 - r * Math.cos(angleRad),
          5,
          0,
          2 * Math.PI,
          false
        );
        colorPointCtx.fillStyle = rgbToHex(...v.rgb);
        colorPointCtx.fill(circle);
      }
    });
  }

  private getOffset(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }
}
