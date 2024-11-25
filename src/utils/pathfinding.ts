import { Vector3 } from 'three';

interface Node {
  x: number;
  z: number;
  f: number;
  g: number;
  h: number;
  parent: Node | null;
}

interface GridCell {
  x: number;
  z: number;
  isWalkable: boolean;
}

class PathFinder {
  private grid: GridCell[][];
  private gridSize: number;
  private cellSize: number;
  private safetyMargin: number;

  constructor(gridSize: number = 32, cellSize: number = 1) {
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.safetyMargin = 0.5; // Add safety margin around obstacles
    this.grid = [];
    this.initializeGrid();
  }

  private initializeGrid() {
    for (let x = 0; x < this.gridSize; x++) {
      this.grid[x] = [];
      for (let z = 0; z < this.gridSize; z++) {
        this.grid[x][z] = {
          x,
          z,
          isWalkable: true
        };
      }
    }
  }

  updateObstacles(obstacles: { position: [number, number, number], dimensions: [number, number, number] }[]) {
    // Reset grid
    this.initializeGrid();

    // Mark cells occupied by obstacles as not walkable
    obstacles.forEach(obstacle => {
      const [posX, _, posZ] = obstacle.position;
      const [sizeX, __, sizeZ] = obstacle.dimensions;

      // Convert world coordinates to grid coordinates with safety margin
      const gridX = Math.floor((posX + this.gridSize / 2) / this.cellSize);
      const gridZ = Math.floor((posZ + this.gridSize / 2) / this.cellSize);

      // Calculate the extent of the obstacle in grid cells with safety margin
      const halfSizeX = Math.ceil((sizeX / 2 + this.safetyMargin) / this.cellSize);
      const halfSizeZ = Math.ceil((sizeZ / 2 + this.safetyMargin) / this.cellSize);

      // Mark cells as not walkable
      for (let x = gridX - halfSizeX; x <= gridX + halfSizeX; x++) {
        for (let z = gridZ - halfSizeZ; z <= gridZ + halfSizeZ; z++) {
          if (this.isValidCell(x, z)) {
            this.grid[x][z].isWalkable = false;
          }
        }
      }
    });
  }

  private isValidCell(x: number, z: number): boolean {
    return x >= 0 && x < this.gridSize && z >= 0 && z < this.gridSize;
  }

  private getHeuristic(nodeA: GridCell, nodeB: GridCell): number {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.z - nodeB.z);
  }

  private getNeighbors(node: GridCell): GridCell[] {
    const neighbors: GridCell[] = [];
    const directions = [
      { x: 0, z: 1 },  // North
      { x: 1, z: 0 },  // East
      { x: 0, z: -1 }, // South
      { x: -1, z: 0 }, // West
      { x: 1, z: 1 },  // Northeast
      { x: 1, z: -1 }, // Southeast
      { x: -1, z: -1 },// Southwest
      { x: -1, z: 1 }  // Northwest
    ];

    for (const dir of directions) {
      const newX = node.x + dir.x;
      const newZ = node.z + dir.z;

      if (this.isValidCell(newX, newZ) && this.grid[newX][newZ].isWalkable) {
        neighbors.push(this.grid[newX][newZ]);
      }
    }

    return neighbors;
  }

  private smoothPath(path: Vector3[]): Vector3[] {
    if (path.length <= 2) return path;

    const smoothed: Vector3[] = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      let furthest = current + 1;
      
      // Look ahead to find furthest visible point
      for (let i = current + 2; i < path.length; i++) {
        if (this.hasLineOfSight(path[current], path[i])) {
          furthest = i;
        }
      }

      smoothed.push(path[furthest]);
      current = furthest;
    }

    return smoothed;
  }

  private hasLineOfSight(start: Vector3, end: Vector3): boolean {
    const startX = Math.floor((start.x + this.gridSize / 2) / this.cellSize);
    const startZ = Math.floor((start.z + this.gridSize / 2) / this.cellSize);
    const endX = Math.floor((end.x + this.gridSize / 2) / this.cellSize);
    const endZ = Math.floor((end.z + this.gridSize / 2) / this.cellSize);

    const dx = Math.abs(endX - startX);
    const dz = Math.abs(endZ - startZ);
    const sx = startX < endX ? 1 : -1;
    const sz = startZ < endZ ? 1 : -1;
    let err = dx - dz;

    let x = startX;
    let z = startZ;

    while (x !== endX || z !== endZ) {
      if (!this.isValidCell(x, z) || !this.grid[x][z].isWalkable) {
        return false;
      }

      const e2 = 2 * err;
      if (e2 > -dz) {
        err -= dz;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        z += sz;
      }
    }

    return true;
  }

  findPath(start: Vector3, end: Vector3): Vector3[] {
    // Convert world coordinates to grid coordinates
    const startX = Math.floor((start.x + this.gridSize / 2) / this.cellSize);
    const startZ = Math.floor((start.z + this.gridSize / 2) / this.cellSize);
    const endX = Math.floor((end.x + this.gridSize / 2) / this.cellSize);
    const endZ = Math.floor((end.z + this.gridSize / 2) / this.cellSize);

    if (!this.isValidCell(startX, startZ) || !this.isValidCell(endX, endZ)) {
      return [];
    }

    // If start or end is in an obstacle, find nearest walkable cell
    if (!this.grid[startX][startZ].isWalkable) {
      const nearest = this.findNearestWalkableCell(startX, startZ);
      if (!nearest) return [];
      start = new Vector3(
        (nearest.x - this.gridSize / 2) * this.cellSize,
        0,
        (nearest.z - this.gridSize / 2) * this.cellSize
      );
    }

    if (!this.grid[endX][endZ].isWalkable) {
      const nearest = this.findNearestWalkableCell(endX, endZ);
      if (!nearest) return [];
      end = new Vector3(
        (nearest.x - this.gridSize / 2) * this.cellSize,
        0,
        (nearest.z - this.gridSize / 2) * this.cellSize
      );
    }

    const startNode: Node = {
      x: startX,
      z: startZ,
      f: 0,
      g: 0,
      h: 0,
      parent: null
    };

    const endNode = this.grid[endX][endZ];
    const openList: Node[] = [startNode];
    const closedList: Set<string> = new Set();

    while (openList.length > 0) {
      // Find node with lowest f score
      let currentNode = openList[0];
      let currentIndex = 0;

      openList.forEach((node, index) => {
        if (node.f < currentNode.f) {
          currentNode = node;
          currentIndex = index;
        }
      });

      // Remove current node from open list and add to closed list
      openList.splice(currentIndex, 1);
      closedList.add(`${currentNode.x},${currentNode.z}`);

      // Check if we've reached the end
      if (currentNode.x === endX && currentNode.z === endZ) {
        const path: Vector3[] = [];
        let current: Node | null = currentNode;

        while (current !== null) {
          // Convert grid coordinates back to world coordinates
          path.unshift(new Vector3(
            (current.x - this.gridSize / 2) * this.cellSize,
            0,
            (current.z - this.gridSize / 2) * this.cellSize
          ));
          current = current.parent;
        }

        // Smooth the path before returning
        return this.smoothPath(path);
      }

      // Check neighbors
      const neighbors = this.getNeighbors(this.grid[currentNode.x][currentNode.z]);

      for (const neighbor of neighbors) {
        if (closedList.has(`${neighbor.x},${neighbor.z}`)) {
          continue;
        }

        const newNode: Node = {
          x: neighbor.x,
          z: neighbor.z,
          g: currentNode.g + 1,
          h: this.getHeuristic(neighbor, endNode),
          f: 0,
          parent: currentNode
        };
        newNode.f = newNode.g + newNode.h;

        // Check if neighbor is already in open list with better path
        const openNode = openList.find(node => node.x === neighbor.x && node.z === neighbor.z);
        if (openNode) {
          if (newNode.g >= openNode.g) {
            continue;
          }
        }

        openList.push(newNode);
      }
    }

    return []; // No path found
  }

  private findNearestWalkableCell(x: number, z: number): GridCell | null {
    const maxRadius = 5; // Maximum search radius
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const newX = x + dx;
          const newZ = z + dz;
          if (this.isValidCell(newX, newZ) && this.grid[newX][newZ].isWalkable) {
            return this.grid[newX][newZ];
          }
        }
      }
    }
    return null;
  }
}

export const pathFinder = new PathFinder();
