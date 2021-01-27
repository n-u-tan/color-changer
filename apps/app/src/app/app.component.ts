import { Component, ElementRef, ViewChild } from '@angular/core';

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
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0); // draw the image
  }
}
