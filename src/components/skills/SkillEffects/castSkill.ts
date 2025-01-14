import { Vector3 } from 'three';
import { castLightningStorm } from './castLightningStorm';
import { castMagicMissiles } from './castMagicMissiles';
import { castMagicBoomerang } from './castMagicBoomerang';
import { castArcaneNova } from './castArcaneNova';
import { castArcaneMultiplication } from './castArcaneMultiplication';
import { castInferno } from './castInferno';
import { castMagicOrb } from './castMagicOrb';
import { castChainLightning } from './castChainLightning';
import { ActiveSkill } from '../skills';

export function castSkill(skill: ActiveSkill, position: Vector3, direction: Vector3, level: number): void {
  switch (skill.name) {
    case 'Magic Orb':
      castMagicOrb(position, direction, level);
      break;
    case 'Magic Boomerang':
      castMagicBoomerang(position, direction, level);
      break;
    case 'Magic Missiles':
      castMagicMissiles(position, level);
      break;
    case 'Arcane Nova':
      castArcaneNova(position, level);
      break;
    case 'Lightning Storm':
      castLightningStorm(position, level);
      break;
    case 'Arcane Multiplication':
      castArcaneMultiplication(position, level);
      break;
    case 'Inferno':
      castInferno(position, level);
      break;
    case 'Chain Lightning':
      castChainLightning(position, direction, level);
      break;
    case 'Thunder Strike':
      // TODO: Implement Thunder Strike
      console.log('Thunder Strike not implemented yet');
      break;
    case 'Tsunami Wave':
      // TODO: Implement Tsunami Wave
      console.log('Tsunami Wave not implemented yet');
      break;
    case 'Water Jet':
      // TODO: Implement Water Jet
      console.log('Water Jet not implemented yet');
      break;
    case 'Whirlpool':
      // TODO: Implement Whirlpool
      console.log('Whirlpool not implemented yet');
      break;
    case 'Force Push':
      // TODO: Implement Force Push
      console.log('Force Push not implemented yet');
      break;
    case 'Gravity Well':
      // TODO: Implement Gravity Well
      console.log('Gravity Well not implemented yet');
      break;
    case 'Ice Lance':
      // TODO: Implement Ice Lance
      console.log('Ice Lance not implemented yet');
      break;
    case 'Frost Nova':
      // TODO: Implement Frost Nova
      console.log('Frost Nova not implemented yet');
      break;
    case 'Blizzard':
      // TODO: Implement Blizzard
      console.log('Blizzard not implemented yet');
      break;
    default:
      console.warn(`Unknown skill: ${skill.name}`);
  }
}
