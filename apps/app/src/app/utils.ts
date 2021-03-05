import { map, tap } from 'rxjs/operators';

export function getOffset(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
}

export const tapEventPreventDefault = tap((event: Event) => {
  event.preventDefault();
});

export function coorToAngle(coor: { x: number; y: number }) {
  const r = Math.sqrt(coor.x * coor.x + coor.y * coor.y);
  let theta = Math.acos(-coor.y / r);
  if (coor.x < 0) {
    theta = 2 * Math.PI - theta;
  }
  return (theta / Math.PI) * 180;
}

export function mapMouseEventToAngleFactory(canvas: HTMLCanvasElement) {
  return map((mouseEvent: MouseEvent) => {
    const offset = getOffset(canvas);
    const point = {
      x: mouseEvent.clientX - offset.left,
      y: mouseEvent.clientY - offset.top
    };
    return coorToAngle({
      x: point.x - 100,
      y: point.y - 100
    });
  });
}

export function mapTouchEventToAngleFactory(canvas: HTMLCanvasElement) {
  return map((touchEvent: TouchEvent) => {
    touchEvent.preventDefault();
    const offset = getOffset(canvas);
    const point = {
      x: touchEvent.changedTouches[0].clientX - offset.left,
      y: touchEvent.changedTouches[0].clientY - offset.top
    };
    return coorToAngle({
      x: point.x - 100,
      y: point.y - 100
    });
  });
}
