import { Object3D, BufferGeometry, Material, InstancedMesh } from 'three';

export class ObjectPool<T extends Object3D> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private createFn: () => T;

  constructor(createFn: () => T, initialSize: number = 100) {
    this.createFn = createFn;
    this.initialize(initialSize);
  }

  private initialize(size: number) {
    for (let i = 0; i < size; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    let object: T;
    if (this.pool.length > 0) {
      object = this.pool.pop()!;
    } else {
      object = this.createFn();
    }
    this.active.add(object);
    return object;
  }

  release(object: T) {
    if (this.active.has(object)) {
      this.active.delete(object);
      this.pool.push(object);
      object.visible = false;
    }
  }

  reset() {
    this.active.forEach(object => {
      this.release(object);
    });
  }
}

export class InstancedPool {
  private mesh: InstancedMesh;
  private available: number[] = [];
  private used: Set<number> = new Set();
  private count: number;

  constructor(geometry: BufferGeometry, material: Material, maxInstances: number) {
    this.mesh = new InstancedMesh(geometry, material, maxInstances);
    this.count = maxInstances;
    this.initialize();
  }

  private initialize() {
    for (let i = 0; i < this.count; i++) {
      this.available.push(i);
    }
  }

  getInstance(): number | null {
    if (this.available.length === 0) return null;
    const index = this.available.pop()!;
    this.used.add(index);
    return index;
  }

  releaseInstance(index: number) {
    if (this.used.has(index)) {
      this.used.delete(index);
      this.available.push(index);
      // Reset instance transform
      this.mesh.setMatrixAt(index, new Object3D().matrix);
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  getMesh(): InstancedMesh {
    return this.mesh;
  }

  reset() {
    this.used.forEach(index => {
      this.releaseInstance(index);
    });
  }
}
