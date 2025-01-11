import {
    GiSpellBook, GiCrystalBall, GiMagicPotion,  // Arcane
    GiSpeedometer, GiLightningBranches, GiLaserSparks,  // Storm
    GiWaterDrop, GiWaterfall, GiWaveStrike,  // Water
    GiWindSlap, GiShieldReflect, GiPush,  // Force
    GiIceBolt, GiSnowflake1, GiFrozenRing,  // Frost - Passive
    GiMissileSwarm, GiEnergyShield, GiShieldBash,   // Arcane - Active
    GiLightningStorm, GiLightningHelix, GiFocusedLightning,  // Storm - Active
    GiWaterSplash, GiHighTide, GiVortex,  // Water - Active
    GiBoomerang, GiPunchBlast, GiVacuumCleaner,  // Force - Active
    GiIceSpellCast, GiIciclesAura, GiSnowman  // Frost - Active
} from 'react-icons/gi';
import { RiMagicFill } from 'react-icons/ri';

export type PassiveSkill = {
    name: string;
    description: string;
    icon: any;
    color: string;
    basePrice: number;
    priceMultiplier: number;
    maxLevel: number;
    cooldown?: number;
    duration?: number;
    effect?: (level: number) => any;
    school: MagicSchool;
};

export type ActiveSkill = {
    name: string;
    icon: any;
    cooldown: number;
    currentCooldown?: number;
    color: string;
    level: number;
    description: string;
    duration?: number;
    maxLevel: number;
    school: MagicSchool;
}

export type MagicSchool = 'arcane' | 'storm' | 'water' | 'force' | 'frost';

export const magicSchools: Record<MagicSchool, {
    name: string;
    color: string;
    icon: any;
    description: string;
}> = {
    arcane: {
        name: 'Arcane',
        color: '#9333ea',
        icon: RiMagicFill,
        description: 'Fundamental magic focusing on raw magical energy and multiplication of effects'
    },
    storm: {
        name: 'Storm',
        color: '#eab308',
        icon: GiLightningStorm,
        description: 'Harness the power of lightning and thunder'
    },
    water: {
        name: 'Water',
        color: '#06b6d4',
        icon: GiWaterSplash,
        description: 'Control the flow of water and tidal forces'
    },
    force: {
        name: 'Force',
        color: '#10b981',
        icon: GiBoomerang,
        description: 'Manipulate kinetic energy and physical forces'
    },
    frost: {
        name: 'Frost',
        color: '#60a5fa',
        icon: GiIceBolt,
        description: 'Command ice and cold energies'
    }
};

export const passiveSkills: (PassiveSkill)[] = [
    // Arcane Skills
    {
        name: 'Arcane Power',
        description: 'Increases magic damage by 20% per level',
        icon: GiSpellBook,
        color: '#9333ea',
        basePrice: 100,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'arcane',
        effect: (level: number) => ({ damage: 1 + level * 0.2 }),
    },
    {
        name: 'Multi Orb',
        description: 'Adds 15% chance per level to cast an additional orb',
        icon: GiCrystalBall,
        color: '#9333ea',
        basePrice: 300,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'arcane',
        effect: (level: number) => ({ multiCast: level * 0.15 }),
    },
    {
        name: 'Mana Mastery',
        description: 'Reduces mana cost of spells by 10% per level',
        icon: GiMagicPotion,
        color: '#9333ea',
        basePrice: 250,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'arcane',
        effect: (level: number) => ({ manaCost: 1 - level * 0.1 }),
    },
    // Storm Skills
    {
        name: 'Swift Cast',
        description: 'Reduces spell cooldown by 10% per level',
        icon: GiSpeedometer,
        color: '#eab308',
        basePrice: 150,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'storm',
        effect: (level: number) => ({ cooldownReduction: level * 0.1 }),
    },
    {
        name: 'Storm Mastery',
        description: 'Increases lightning damage by 25% per level',
        icon: GiLightningBranches,
        color: '#eab308',
        basePrice: 200,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'storm',
        effect: (level: number) => ({ lightningDamage: 1 + level * 0.25 }),
    },
    {
        name: 'Static Charge',
        description: 'Adds 15% chance per level to shock enemies',
        icon: GiLaserSparks,
        color: '#eab308',
        basePrice: 250,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'storm',
        effect: (level: number) => ({ shockChance: level * 0.15 }),
    },
    // Water Skills
    {
        name: 'Mystic Reach',
        description: 'Increases spell range by 15% per level',
        icon: GiWaterDrop,
        color: '#06b6d4',
        basePrice: 200,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'water',
        effect: (level: number) => ({ range: 1 + level * 0.15 }),
    },
    {
        name: 'Tidal Force',
        description: 'Increases knockback effect by 20% per level',
        icon: GiWaterfall,
        color: '#06b6d4',
        basePrice: 250,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'water',
        effect: (level: number) => ({ knockback: 1 + level * 0.2 }),
    },
    {
        name: 'Flow State',
        description: 'Increases movement speed by 10% per level while casting',
        icon: GiWaveStrike,
        color: '#06b6d4',
        basePrice: 200,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'water',
        effect: (level: number) => ({ moveSpeed: 1 + level * 0.1 }),
    },
    // Force Skills
    {
        name: 'Force Amplification',
        description: 'Increases physical damage by 25% per level',
        icon: GiWindSlap,
        color: '#10b981',
        basePrice: 200,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'force',
        effect: (level: number) => ({ forceDamage: 1 + level * 0.25 }),
    },
    {
        name: 'Kinetic Mastery',
        description: 'Increases projectile speed by 15% per level',
        icon: GiShieldReflect,
        color: '#10b981',
        basePrice: 180,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'force',
        effect: (level: number) => ({ projectileSpeed: 1 + level * 0.15 }),
    },
    {
        name: 'Impact Resonance',
        description: 'Adds 20% chance per level for force spells to stun',
        icon: GiPush,
        color: '#10b981',
        basePrice: 300,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'force',
        effect: (level: number) => ({ stunChance: level * 0.2 }),
    },
    // Frost Skills
    {
        name: 'Frost Mastery',
        description: 'Increases frost damage by 25% per level',
        icon: GiIceBolt,
        color: '#60a5fa',
        basePrice: 200,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'frost',
        effect: (level: number) => ({ frostDamage: 1 + level * 0.25 }),
    },
    {
        name: 'Glacial Presence',
        description: 'Increases slow effect duration by 20% per level',
        icon: GiSnowflake1,
        color: '#60a5fa',
        basePrice: 250,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'frost',
        effect: (level: number) => ({ slowDuration: 1 + level * 0.2 }),
    },
    {
        name: 'Deep Freeze',
        description: 'Adds 15% chance per level to freeze enemies solid',
        icon: GiFrozenRing,
        color: '#60a5fa',
        basePrice: 300,
        priceMultiplier: 1.5,
        maxLevel: 20,
        school: 'frost',
        effect: (level: number) => ({ freezeChance: level * 0.15 }),
    },
];

export const activeSkills: (ActiveSkill)[] = [
    // Arcane Skills
    {
        name: 'Magic Missiles',
        description: 'Launch multiple homing missiles that deal damage to enemies',
        icon: GiMissileSwarm,
        color: '#9333ea',
        cooldown: 2,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'arcane',
    },
    {
        name: 'Arcane Nova',
        description: 'Release a burst of arcane energy, damaging nearby enemies',
        icon: GiEnergyShield,
        color: '#9333ea',
        cooldown: 6,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'arcane',
    },
    {
        name: 'Arcane Multiplication',
        description: 'Temporarily triple all your magical effects',
        icon: GiShieldBash,
        color: '#9333ea',
        cooldown: 10,
        duration: 5,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'arcane',
    },
    // Storm Skills
    {
        name: 'Lightning Storm',
        description: 'Call down lightning strikes on random enemies',
        icon: GiLightningStorm,
        color: '#eab308',
        duration: 8,
        cooldown: process.env.NODE_ENV === "development" ? 1 : 8,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'storm',
    },
    {
        name: 'Chain Lightning',
        description: 'Launch a lightning bolt that chains between enemies',
        icon: GiLightningHelix,
        color: '#eab308',
        cooldown: 4,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'storm',
    },
    {
        name: 'Thunder Strike',
        description: 'Call down a massive thunderbolt at target location',
        icon: GiFocusedLightning,
        color: '#eab308',
        cooldown: 12,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'storm',
    },
    // Water Skills
    {
        name: 'Tsunami Wave',
        description: 'Summon a massive wave that damages and pushes back enemies',
        icon: GiWaterSplash,
        color: '#06b6d4',
        cooldown: 12,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'water',
    },
    {
        name: 'Water Jet',
        description: 'Fire a high-pressure water beam that pierces enemies',
        icon: GiHighTide,
        color: '#06b6d4',
        cooldown: 3,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'water',
    },
    {
        name: 'Whirlpool',
        description: 'Create a vortex that pulls and damages enemies',
        icon: GiVortex,
        color: '#06b6d4',
        cooldown: 8,
        duration: 4,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'water',
    },
    // Force Skills
    {
        name: 'Magic Boomerang',
        description: 'Launch a magical boomerang that damages enemies in its path',
        icon: GiBoomerang,
        color: '#10b981',
        cooldown: 4,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'force',
    },
    {
        name: 'Force Push',
        description: 'Release a powerful shockwave that knocks back enemies',
        icon: GiPunchBlast,
        color: '#10b981',
        cooldown: 6,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'force',
    },
    {
        name: 'Gravity Well',
        description: 'Create a zone that crushes enemies with intense gravity',
        icon: GiVacuumCleaner,
        color: '#10b981',
        cooldown: 10,
        duration: 5,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'force',
    },
    // Frost Skills
    {
        name: 'Ice Lance',
        description: 'Fire a piercing lance of ice that freezes enemies',
        icon: GiIceSpellCast,
        color: '#60a5fa',
        cooldown: 3,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'frost',
    },
    {
        name: 'Frost Nova',
        description: 'Release a burst of frost that slows nearby enemies',
        icon: GiIciclesAura,
        color: '#60a5fa',
        cooldown: 8,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'frost',
    },
    {
        name: 'Blizzard',
        description: 'Summon a blizzard that continuously damages and slows enemies',
        icon: GiSnowman,
        color: '#60a5fa',
        cooldown: 15,
        duration: 6,
        level: process.env.NODE_ENV === "development" ? 1 : 0,
        maxLevel: 20,
        school: 'frost',
    },
];