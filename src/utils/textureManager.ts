import { TextureLoader, Texture, CompressedTexture, WebGLRenderer } from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

export class TextureManager {
  private static instance: TextureManager;
  private textureLoader: TextureLoader;
  private ktx2Loader: KTX2Loader;
  private textureCache: Map<string, Texture | CompressedTexture>;

  private constructor(renderer: WebGLRenderer) {
    this.textureLoader = new TextureLoader();
    this.ktx2Loader = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer);
    this.textureCache = new Map();
  }

  static getInstance(renderer: WebGLRenderer): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager(renderer);
    }
    return TextureManager.instance;
  }

  async loadTexture(path: string, compressed: boolean = true): Promise<Texture | CompressedTexture> {
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path)!;
    }

    try {
      const texture = compressed
        ? await this.loadCompressedTexture(path)
        : await this.loadRegularTexture(path);

      // Configure texture
      texture.generateMipmaps = true;
      texture.anisotropy = 16;

      this.textureCache.set(path, texture);
      return texture;
    } catch (error) {
      console.error(`Failed to load texture: ${path}`, error);
      throw error;
    }
  }

  private loadCompressedTexture(path: string): Promise<CompressedTexture> {
    return new Promise((resolve, reject) => {
      this.ktx2Loader.load(
        path,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error)
      );
    });
  }

  private loadRegularTexture(path: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error)
      );
    });
  }

  releaseTexture(path: string) {
    const texture = this.textureCache.get(path);
    if (texture) {
      texture.dispose();
      this.textureCache.delete(path);
    }
  }

  clear() {
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
  }
}
