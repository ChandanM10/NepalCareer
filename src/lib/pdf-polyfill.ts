export function ensureDOMPolyfills(): void {
  if (typeof globalThis.DOMMatrix === "undefined") {
    class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor(init?: string | number[]) {
        if (typeof init === "string") {
          const m = init.match(/matrix\(([^)]+)\)/);
          if (m) { const vals = m[1].split(",").map(Number); if (vals.length === 6) { this.a = vals[0]; this.b = vals[1]; this.c = vals[2]; this.d = vals[3]; this.e = vals[4]; this.f = vals[5]; } }
        } else if (Array.isArray(init) && init.length === 6) {
          this.a = init[0]; this.b = init[1]; this.c = init[2]; this.d = init[3]; this.e = init[4]; this.f = init[5];
        }
      }
      multiply(other: DOMMatrix): DOMMatrix { return other; }
      translate(tx: number, ty: number): DOMMatrix { return new DOMMatrix([this.a, this.b, this.c, this.d, this.e + tx, this.f + ty]); }
      scale(sx: number, sy: number): DOMMatrix { return new DOMMatrix([this.a * sx, this.b * sy, this.c * sx, this.d * sy, this.e, this.f]); }
      rotate(angle: number): DOMMatrix { const r = (angle * Math.PI) / 180; const c = Math.cos(r); const s = Math.sin(r); return new DOMMatrix([this.a * c + this.c * s, this.b * c + this.d * s, this.a * -s + this.c * c, this.b * -s + this.d * c, this.e, this.f]); }
      inverse(): DOMMatrix { const det = this.a * this.d - this.b * this.c; if (det === 0) return new DOMMatrix(); return new DOMMatrix([this.d / det, -this.b / det, -this.c / det, this.a / det, (this.c * this.f - this.d * this.e) / det, (this.b * this.e - this.a * this.f) / det]); }
      transformPoint(point: { x: number; y: number }): { x: number; y: number } { return { x: this.a * point.x + this.c * point.y + this.e, y: this.b * point.x + this.d * point.y + this.f }; }
      toString(): string { return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`; }
      static fromMatrix(other: DOMMatrix): DOMMatrix { return new DOMMatrix([other.a, other.b, other.c, other.d, other.e, other.f]); }
      static fromTransform(): DOMMatrix { return new DOMMatrix(); }
      static fromFloat32Array(arr: Float32Array): DOMMatrix { return new DOMMatrix(Array.from(arr)); }
      static fromFloat64Array(arr: Float64Array): DOMMatrix { return new DOMMatrix(Array.from(arr)); }
    }
    (globalThis as any).DOMMatrix = DOMMatrix;
  }

  if (typeof globalThis.DOMPoint === "undefined") {
    class DOMPoint {
      x = 0; y = 0; z = 0; w = 1;
      constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
      matrixTransform(): DOMPoint { return this; }
      static fromPoint(point: { x: number; y: number }): DOMPoint { return new DOMPoint(point.x, point.y); }
    }
    (globalThis as any).DOMPoint = DOMPoint;
  }

  if (typeof globalThis.DOMRect === "undefined") {
    class DOMRect {
      x = 0; y = 0; width = 0; height = 0;
      constructor(x = 0, y = 0, width = 0, height = 0) { this.x = x; this.y = y; this.width = width; this.height = height; }
      get top() { return this.y; }
      get left() { return this.x; }
      get right() { return this.x + this.width; }
      get bottom() { return this.y + this.height; }
      static fromRect(other: DOMRect): DOMRect { return new DOMRect(other.x, other.y, other.width, other.height); }
    }
    (globalThis as any).DOMRect = DOMRect;
  }
}
