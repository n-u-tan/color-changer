import { Mesh, Plane, Program, Renderer, Texture } from 'ogl-typescript';

export class ImageLoader {
  static loadFromUrl(src) {
    const image = new Image();

    image.setAttribute('anonymous', true as any);
    image.setAttribute('crossorigin', true as any);

    return new Promise((resolve, reject) => {
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', () =>
        reject(new Error('Unable to load image'))
      );
      image.src = src;
    });
  }

  static loadFromFile(file) {
    return ImageLoader.loadFromUrl(URL.createObjectURL(file));
  }
}

export class Application {
  private _renderer: Renderer;
  private _map: Texture;
  private _mesh: Mesh;

  constructor() {
    this._renderer = new Renderer();
    this._map = new Texture(this._gl);
    this._mesh = this.createMesh(this._map);
  }

  get canvas() {
    return this._renderer.gl.canvas;
  }

  createMesh(map) {
    const geometry = new Plane(this._gl, {
      height: 2,
      width: 2
    });

    const program = new Program(this._gl, {
      fragment: `
				precision mediump float;

				uniform sampler2D u_map;

        uniform float u_inputStartAngle;
        uniform float u_inputEndAngle;
        uniform float u_outputAngle;

				varying vec2 v_uv;

        vec3 RGBToHSL(vec3 color) {
          vec3 hsl; // init to 0 to avoid warnings ? (and reverse if + remove first part)

          float fmin = min(min(color.r, color.g), color.b); //Min. value of RGB
          float fmax = max(max(color.r, color.g), color.b); //Max. value of RGB
          float delta = fmax - fmin; //Delta RGB value

          hsl.z = (fmax + fmin) / 2.0; // Luminance

          if (delta == 0.0)	 //This is a gray, no chroma...
          {
            hsl.x = 0.0;	// Hue
            hsl.y = 0.0;	// Saturation
          }
          else //Chromatic data...
          {
            if (hsl.z < 0.5)
              hsl.y = delta / (fmax + fmin); // Saturation
            else
              hsl.y = delta / (2.0 - fmax - fmin); // Saturation

            float deltaR = (((fmax - color.r) / 6.0) + (delta / 2.0)) / delta;
            float deltaG = (((fmax - color.g) / 6.0) + (delta / 2.0)) / delta;
            float deltaB = (((fmax - color.b) / 6.0) + (delta / 2.0)) / delta;

            if (color.r == fmax )
              hsl.x = deltaB - deltaG; // Hue
            else if (color.g == fmax)
              hsl.x = (1.0 / 3.0) + deltaR - deltaB; // Hue
            else if (color.b == fmax)
              hsl.x = (2.0 / 3.0) + deltaG - deltaR; // Hue

            if (hsl.x < 0.0)
              hsl.x += 1.0; // Hue
            else if (hsl.x > 1.0)
              hsl.x -= 1.0; // Hue
          }

          return hsl;
        }

        float HueToRGB(float f1, float f2, float hue) {
          if (hue < 0.0)
            hue += 1.0;
          else if (hue > 1.0)
            hue -= 1.0;
          float res;
          if ((6.0 * hue) < 1.0)
            res = f1 + (f2 - f1) * 6.0 * hue;
          else if ((2.0 * hue) < 1.0)
            res = f2;
          else if ((3.0 * hue) < 2.0)
            res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
          else
            res = f1;
          return res;
        }

        vec3 HSLToRGB(vec3 hsl) {
          vec3 rgb;

          if (hsl.y == 0.0)
            rgb = vec3(hsl.z); // Luminance
          else
          {
            float f2;

            if (hsl.z < 0.5)
              f2 = hsl.z * (1.0 + hsl.y);
            else
              f2 = (hsl.z + hsl.y) - (hsl.y * hsl.z);

            float f1 = 2.0 * hsl.z - f2;

            rgb.r = HueToRGB(f1, f2, hsl.x + (1.0/3.0));
            rgb.g = HueToRGB(f1, f2, hsl.x);
            rgb.b= HueToRGB(f1, f2, hsl.x - (1.0/3.0));
          }

          return rgb;
        }

				void main() {
					vec4 texel = texture2D(u_map, v_uv);
          vec3 hsl = RGBToHSL(texel.rgb);
          float hAngle = hsl.x * 360.0;
          if (
            (u_inputStartAngle <= u_inputEndAngle && u_inputStartAngle <= hAngle && u_inputEndAngle >= hAngle) ||
            (u_inputStartAngle > u_inputEndAngle && (hAngle >= u_inputStartAngle || u_inputEndAngle <= hAngle))
          ) {
            hsl.x = u_outputAngle / 360.0;
            texel.rgb = HSLToRGB(hsl);
          }
					gl_FragColor = texel;
				}
			`,
      vertex: `
				attribute vec4 position;
				attribute vec2 uv;

				varying vec2 v_uv;

				void main() {
					v_uv = uv;

					gl_Position = position;
				}
			`,

      uniforms: {
        u_inputStartAngle: { value: 150 },
        u_inputEndAngle: { value: 270 },
        u_outputAngle: { value: 60 },
        u_map: { value: map }
      }
    });

    return new Mesh(this._gl, {
      geometry,
      program
    });
  }

  setImage(image) {
    this._map.image = image;
    this._map.needsUpdate = true;

    this.setSize(image.naturalWidth, image.naturalHeight);
    this.render();
  }

  setInputStartAngle(angle: number) {
    this._mesh.program.uniforms.u_inputStartAngle.value = angle;
    this.render();
  }

  setInputEndAngle(angle: number) {
    this._mesh.program.uniforms.u_inputEndAngle.value = angle;
    this.render();
  }

  setOutputAngle(angle: number) {
    this._mesh.program.uniforms.u_outputAngle.value = angle;
    this.render();
  }

  setSize(width, height) {
    this._renderer.setSize(width, height);
  }

  render() {
    this._renderer.render({
      scene: this._mesh
    });
  }

  get _gl() {
    return this._renderer.gl;
  }
}
