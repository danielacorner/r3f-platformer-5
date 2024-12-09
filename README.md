# R3F Tower Defense Game

A modern 3D tower defense game built with React Three Fiber (R3F) and React. Featuring dynamic gameplay, real-time physics, and beautiful visual effects.

## Features

- 3D tower defense gameplay with real-time physics
- Dynamic building system for placing towers
- Wave-based enemy spawning system
- Beautiful visual effects including soft shadows and bloom
- Smooth camera controls with panning and orbiting
- Interactive build menu and game UI
- Real-time physics powered by Rapier

## Technologies

- React 18
- Three.js
- React Three Fiber (@react-three/fiber)
- React Three Drei (@react-three/drei)
- React Three Rapier for physics
- React Spring for animations
- Zustand for state management
- TypeScript
- Vite
- TailwindCSS

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/r3f-platformer-5.git
cd r3f-platformer-5
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Development

### Project Structure

- `/src` - Main source code
  - `/components` - React components including game elements
  - `/models` - 3D models and assets
  - `/store` - Zustand state management
  - `/styles` - CSS styles
  - `/utils` - Utility functions
  - `/hooks` - Custom React hooks

### Building for Production

```bash
npm run build
# or
yarn build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React Three Fiber community
- Three.js community
- Contributors and maintainers of all dependencies
