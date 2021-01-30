import { Component, ElementRef, ViewChild } from '@angular/core';

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

function RGBToHSL(r: number, g: number, b: number) {
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
export class AppComponent {
  title = 'app';
  @ViewChild('fileInput', { static: true }) public fileInputElement: ElementRef<
    HTMLInputElement
  >;
  @ViewChild('canvas', { static: true }) public canvasElement: ElementRef<
    HTMLCanvasElement
  >;

  public onFileChanged() {
    const file: Blob = this.fileInputElement.nativeElement.files[0];
    const fr = new FileReader();
    fr.onload = () => {
      this.createImage(fr);
    };
    fr.readAsDataURL(file);
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
    console.log(img.width, img.height);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0); // draw the image
    let imageData: ImageData;
    imageData = ctx.getImageData(0, 0, img.width, img.height);

    const data = imageData.data;
    console.log(data);
    length = data.length;
    console.log(length);
    let i = -4;
    while ((i += 1 * 4) < length) {
      console.log('rgb', data[i], data[i + 1], data[i + 2]);
      const hsl = RGBToHSL(data[i], data[i + 1], data[i + 2]);
      if (hsl[0] <= 270 && hsl[0] >= 150) {
        const newHsl: [number, number, number] = [60, hsl[1], hsl[2]];
        const newRgb = HSLToRGB(...newHsl);
        data[i] = newRgb[0];
        data[i + 1] = newRgb[1];
        data[i + 2] = newRgb[2];
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
}
