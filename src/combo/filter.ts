import { Character } from "../melee/characters";
import { ComboType, GameStartType } from "slp-parser-js";
import { ALL_CRITERIA } from "./criteria";

export interface ComboFilterSettings {
  chainGrabbers: Character[];
  characterFilter: Character[];
  portFilter: number[];
  nameTags: string[];
  minComboLength: number;
  minComboPercent: number;
  comboMustKill: boolean;
  excludeCPUs: boolean;
  excludeChainGrabs: boolean;
  excludeWobbles: boolean;
  largeHitThreshold: number; // The proportion of damage that a hit has to do to be considered a large hit
  wobbleThreshold: number; // The number of pummels before it's considered a wobble
  chainGrabThreshold: number; // proportion of up throw / pummels to other moves to be considered a chain grab
  perCharacterMinComboPercent: { [characterId: number]: number };
}

export type Criteria = (combo: ComboType, settings: GameStartType, options: ComboFilterSettings, metadata?: any) => boolean;

export const defaultComboFilterSettings: ComboFilterSettings = {
  chainGrabbers: [Character.MARTH, Character.PEACH, Character.PIKACHU, Character.DR_MARIO],
  characterFilter: [],
  portFilter: [1, 2, 3, 4], // Enable combos for all ports
  nameTags: [],
  minComboLength: 1,
  minComboPercent: 60,
  comboMustKill: true,
  excludeCPUs: true,
  excludeChainGrabs: true,
  excludeWobbles: true,
  largeHitThreshold: 0.8,
  wobbleThreshold: 8,
  chainGrabThreshold: 0.8,
  perCharacterMinComboPercent: {
    [Character.JIGGLYPUFF]: 85,
  },
}

export class ComboFilter {
  public criteria: Criteria[];
  private settings: ComboFilterSettings;
  private originalSettings: ComboFilterSettings;

  public constructor(options?: Partial<ComboFilterSettings>) {
    this.settings = Object.assign({}, defaultComboFilterSettings, options);
    this.originalSettings = Object.assign({}, this.settings);
    this.criteria = [ ...ALL_CRITERIA ];
  }

  public updateSettings(options: Partial<ComboFilterSettings>): ComboFilterSettings {
    this.settings = Object.assign({}, this.settings, options);
    return this.getSettings();
  }

  public getSettings(): ComboFilterSettings {
    // Return a copy of the settings for immutability
    return Object.assign({}, this.settings);
  }

  public resetSettings(): ComboFilterSettings {
    return this.updateSettings(this.originalSettings);
  }

  public isCombo(combo: ComboType, settings: GameStartType, metadata?: any): boolean {
    return checkCombo(this.settings, combo, settings, this.criteria, metadata);
  }
}

export const checkCombo = (
  comboSettings: ComboFilterSettings,
  combo: ComboType,
  gameSettings: GameStartType,
  criteria?: Criteria[],
  metadata?: any,
): boolean => {
  const criteriaToCheck = criteria && criteria.length > 0 ? criteria : [ ...ALL_CRITERIA ];

  // Check if we satisfy all the criteria
  for (const c of criteriaToCheck) {
    if (!c(combo, gameSettings, comboSettings, metadata)) {
      return false;
    }
  }

  // If we made it through all the criteria then it was a valid combo
  return true;
};

