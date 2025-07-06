/*
abstract class AbstractRune<K extends string> {
  readonly name: string
  readonly description: string
  readonly valueText: string

  readonly costCoefficient: Decimal
  readonly levelsPerOOM: number
  readonly levelsPerOOMIncrease: () => number
  readonly effectiveLevelMult: () => number
  readonly _freeLevels: () => number
  readonly _runeEXPPerOffering: (purchasedLevels: number) => Decimal
  readonly _isUnlocked: () => boolean
  readonly minimalResetTier: keyof typeof resetTiers

  public runeEXP = new Decimal('0')

  protected abstract readonly key: K // Changed to protected abstract

  constructor (data: BaseRuneData, keyName: string) {
    this.name = i18next.t(`runes.${keyName}.name`)
    this.description = i18next.t(`runes.${keyName}.description`)
    this.valueText = i18next.t(`runes.${keyName}.values`)

    this.costCoefficient = data.costCoefficient
    this.levelsPerOOM = data.levelsPerOOM
    this.levelsPerOOMIncrease = data.levelsPerOOMIncrease
    this.effectiveLevelMult = data.effectiveLevelMult
    this._freeLevels = data.freeLevels
    this._runeEXPPerOffering = data.runeEXPPerOffering
    this._isUnlocked = data.isUnlocked
    this.minimalResetTier = data.minimalResetTier

    if (data.runeEXP != null) {
      this.runeEXP = Decimal.fromDecimal(data.runeEXP)
    }
  }

  get effectiveLevelsPerOOM () {
    return this.levelsPerOOM + this.levelsPerOOMIncrease()
  }

  get level (): number {
    if (player.singularityChallenges.noOfferingPower.enabled && this.isUnlocked) {
      return 1
    }
    if (!this.isUnlocked) {
      return 0
    }
    return Math.floor(this.effectiveLevelsPerOOM * Decimal.log10(this.runeEXP.div(this.costCoefficient).plus(1)))
  }

  get TNL (): Decimal {
    const lvl = this.level
    const expReq = this.computeEXPToLevel(lvl + 1)
    return Decimal.max(0, expReq.sub(this.runeEXP))
  }

  abstract get effectiveRuneLevel (): number

  get freeLevels (): number {
    return this._freeLevels()
  }

  get perOfferingEXP () {
    return this._runeEXPPerOffering(this.level)
  }

  get offeringsToNextLevel () {
    return this.TNL.div(this.perOfferingEXP).ceil()
  }

  get isUnlocked () {
    return this._isUnlocked()
  }

  computeEXPToLevel (level: number) {
    return new Decimal(this.costCoefficient).times(Decimal.pow(10, level / this.effectiveLevelsPerOOM).minus(1))
  }

  computeEXPLeftToLevel (level: number) {
    return Decimal.max(0, this.computeEXPToLevel(level).minus(this.runeEXP))
  }

  computeOfferingsToLevel (level: number) {
    return Decimal.max(1, this.computeEXPLeftToLevel(level).div(this.perOfferingEXP).ceil())
  }

  abstract updatePlayerEXP (): void

  updateRuneEXP (exp: Decimal) {
    this.runeEXP = Decimal.fromDecimal(exp)
    this.updatePlayerEXP()

    this.updateRuneEffectHTML()
  }

  addRuneEXP (offerings: Decimal) {
    this.runeEXP = this.runeEXP.plus(offerings.times(this.perOfferingEXP))
    this.updatePlayerEXP()

    this.updateRuneEffectHTML()
  }

  resetRuneEXP () {
    this.runeEXP = new Decimal('0')
    this.updatePlayerEXP()

    this.updateRuneEffectHTML()
  }

  setToLevel (level: number) {
    const exp = this.computeEXPToLevel(level)
    this.updateRuneEXP(exp)
  }

  levelRune (timesLeveled: number, budget: Decimal) {
    let budgetUsed = new Decimal(0)

    const expRequired = this.computeEXPLeftToLevel(this.level + timesLeveled)
    const offeringsRequired = Decimal.max(1, expRequired.div(this.perOfferingEXP).ceil())

    if (offeringsRequired.gt(budget)) {
      this.addRuneEXP(new Decimal(budget))
      budgetUsed = budget
    } else {
      this.addRuneEXP(offeringsRequired)
      budgetUsed = offeringsRequired
    }

    player.offerings = player.offerings.sub(budgetUsed)

    this.updatePlayerEXP()
    this.updateRuneEffectHTML()
  }

  abstract updateRuneHTML (): void
  abstract updateFocusedRuneHTML (): void
  abstract updateRuneEffectHTML (): void
}

class Rune<K extends RuneKeys> extends AbstractRune<K> {
  protected readonly key: K
  public rewards: (level: number) => RuneTypeMap[K]

  constructor (data: RuneData<K>, key: K) {
    super(data, key)
    this.key = key
    this.rewards = data.rewards
  }

  get rewardDesc () {
    return this.bonus.desc()
  }

  get bonus () {
    if (!this.isUnlocked) {
      return this.rewards(0)
    }
    return this.rewards(this.effectiveRuneLevel)
  }

  get effectiveRuneLevel (): number {
    if (
      (player.currentChallenge.reincarnation === 9 && resetTiers[this.minimalResetTier] < resetTiers.singularity)
      || player.singularityChallenges.noOfferingPower.enabled
    ) {
      return this.effectiveLevelMult()
    }

    return (this.level + this.freeLevels) * this.effectiveLevelMult()
  }

  updatePlayerEXP (): void {
    if (player.runes && this.key in player.runes) {
      player.runes[this.key] = Decimal.fromDecimal(this.runeEXP)
    } else {
      console.error(`Player object does not have a property for ${this.key}.`)
    }
  }

  updateRuneHTML () {
    assert(G.currentTab === Tabs.Runes, 'current tab is not Runes')

    DOMCacheGetOrSet(`${this.key}RuneLevel`).textContent = i18next.t('runes.level', { x: format(this.level, 0, true) })
    DOMCacheGetOrSet(`${this.key}RuneFreeLevel`).textContent = i18next.t('runes.freeLevels', {
      x: format(this.freeLevels, 0, true)
    })
    DOMCacheGetOrSet(`${this.key}RuneTNL`).textContent = i18next.t('runes.TNL', { EXP: format(this.TNL, 2, false) })
  }

  updateFocusedRuneHTML () {
    assert(G.currentTab === Tabs.Runes, 'current tab is not Runes')

    DOMCacheGetOrSet('focusedRuneName').textContent = this.name
    DOMCacheGetOrSet('focusedRuneDescription').innerHTML = this.description
    DOMCacheGetOrSet('focusedRuneValues').innerHTML = this.valueText
    DOMCacheGetOrSet('focusedRuneCoefficient').textContent = i18next.t('runes.runeCoefficientText', {
      x: format(this.levelsPerOOM, 2, true),
      y: format(this.levelsPerOOMIncrease(), 2, true),
      z: format(this.effectiveLevelsPerOOM, 2, true)
    })
    DOMCacheGetOrSet('focusedRuneLevelInfo').textContent = i18next.t('runes.offeringText', {
      exp: format(this.perOfferingEXP, 2, true),
      offeringReq: format(this.computeOfferingsToLevel(this.level + player.offeringbuyamount), 0, true),
      levels: format(player.offeringbuyamount, 0, true)
    })
  }

  updateRuneEffectHTML () {
    if (G.currentTab === Tabs.Runes) {
      DOMCacheGetOrSet(`${this.key}RunePower`).innerHTML = this.rewardDesc
    }
  }
}

class RuneBlessing<K extends RuneBlessingKeys> extends AbstractRune<K> {
  protected readonly key: K
  public rewards: (level: number) => RuneBlessingTypeMap[K]

  constructor (data: RuneBlessingData<K>, key: K) {
    super(data, key)
    this.key = key
    this.rewards = data.rewards
  }

  get rewardDesc () {
    return this.bonus.desc()
  }

  get bonus () {
    if (!this.isUnlocked) {
      return this.rewards(0)
    }
    return this.rewards(this.effectiveRuneLevel)
  }

  get effectiveRuneLevel (): number {
    if (player.singularityChallenges.noOfferingPower.enabled) {
      return 1
    }

    return (this.level + this.freeLevels) * this.effectiveLevelMult()
  }

  updatePlayerEXP (): void {
    if (player.runeBlessings && this.key in player.runeBlessings) {
      player.runeBlessings[this.key as RuneBlessingKeys] = Decimal.fromDecimal(this.runeEXP)
    } else {
      console.error(`Player object does not have a property for ${this.key} in Blessings.`)
    }
  }

  updateRuneHTML () {
    assert(G.currentTab === Tabs.Runes, 'current tab is not Runes')
    const levelsToDisplay = Math.min(
      player.runeBlessingBuyAmount,
      Math.max(1, this.getLevelEstimate(player.offerings) - this.level)
    )

    DOMCacheGetOrSet(`${this.key}RuneBlessingLevel`).innerHTML = `${
      i18next.t('runes.blessings.blessingLevel', {
        amount: format(this.level, 0, true)
      })
    } <br> ${i18next.t('runes.offeringInvested', { amount: format(this.runeEXP, 0, false) })}`
    DOMCacheGetOrSet(`${this.key}RuneBlessingPurchase`).innerHTML = i18next.t('runes.blessings.increaseLevel', {
      amount: format(levelsToDisplay, 0, true),
      offerings: format(this.computeOfferingsToLevel(this.level + levelsToDisplay), 0, false)
    })
    DOMCacheGetOrSet(`${this.key}RuneBlessingPower`).innerHTML = i18next.t('runes.blessings.blessingPower', {
      value: format(this.effectiveRuneLevel, 0, true),
      desc: this.rewardDesc
    })
  }

  updateFocusedRuneHTML () {
  }

  updateRuneEffectHTML () {
  }

  getLevelEstimate = (extraEXP: Decimal) => {
    const totalEXP = this.runeEXP.plus(extraEXP)
    return Math.floor(this.effectiveLevelsPerOOM * Decimal.log10(totalEXP.div(this.costCoefficient).plus(1)))
  }
}

class RuneSpirit<K extends RuneSpiritKeys> extends AbstractRune<K> {
  protected readonly key: K
  public rewards: (level: number) => RuneSpiritTypeMap[K]
  constructor (data: RuneSpiritData<K>, key: K) {
    super(data, key)
    this.key = key
    this.rewards = data.rewards
  }

  get rewardDesc () {
    return this.bonus.desc()
  }

  get bonus () {
    if (!this.isUnlocked) {
      return this.rewards(0)
    }
    return this.rewards(this.effectiveRuneLevel)
  }

  get effectiveRuneLevel (): number {
    if (player.singularityChallenges.noOfferingPower.enabled) {
      return 1
    }

    return (this.level + this.freeLevels) * this.effectiveLevelMult()
  }

  updatePlayerEXP (): void {
    if (player.runeSpirits && this.key in player.runeSpirits) {
      player.runeSpirits[this.key] = Decimal.fromDecimal(this.runeEXP)
    } else {
      console.error(`Player object does not have a property for ${this.key} in Spirits.`)
    }
  }

  updateRuneHTML () {
    assert(G.currentTab === Tabs.Runes, 'current tab is not Runes')
    const levelsToDisplay = Math.min(
      player.runeSpiritBuyAmount,
      Math.max(1, this.getLevelEstimate(player.offerings) - this.level)
    )

    DOMCacheGetOrSet(`${this.key}RuneSpiritLevel`).innerHTML = `${
      i18next.t('runes.spirits.spiritLevel', {
        amount: format(this.level, 0, true)
      })
    } <br> ${i18next.t('runes.offeringInvested', { amount: format(this.runeEXP, 0, false) })}`
    DOMCacheGetOrSet(`${this.key}RuneSpiritPurchase`).innerHTML = i18next.t('runes.blessings.increaseLevel', {
      amount: format(levelsToDisplay, 0, true),
      offerings: format(this.computeOfferingsToLevel(this.level + levelsToDisplay), 0, false)
    })
    DOMCacheGetOrSet(`${this.key}RuneSpiritPower`).innerHTML = i18next.t('runes.spirits.spiritPower', {
      value: format(this.effectiveRuneLevel, 0, true),
      desc: this.rewardDesc
    })
  }

  updateFocusedRuneHTML () {
  }
  updateRuneEffectHTML () {
  }

  getLevelEstimate = (extraEXP: Decimal) => {
    const totalEXP = this.runeEXP.plus(extraEXP)
    return Math.floor(this.effectiveLevelsPerOOM * Decimal.log10(totalEXP.div(this.costCoefficient).plus(1)))
  }
} */

import Decimal from "break_infinity.js"
import { resetTiers } from "./Reset"
import { RuneKeys, runes } from "./Runes"
import { getTalismanEffects } from "./Talismans"
import { format, player } from "./Synergism"
import { Globals as G } from "./Variables"
import i18next from "i18next"
import { calculateSalvageRuneEXPMultiplier } from "./Calculate"
import { achievementManager } from "./Achievements"
import { assert } from "./Utility"
import { Tabs } from "./Tabs"
import { DOMCacheGetOrSet } from "./Cache/DOM"

  /** Blessings */



type RuneBlessingTypeMap = {
  speed: { globalSpeed: number }
  duplication: { multiplierBoosts: number }
  prism: { antSacrificeMult: number }
  thrift: { accelBoostCostDelay: number }
  superiorIntellect: { obtToAntExponent: number }
}

export type RuneBlessingKeys = keyof RuneBlessingTypeMap

export interface RuneBlessingData<K extends RuneBlessingKeys> {
  level: number
  runeEXP: Decimal
  costCoefficient: Decimal
  levelsPerOOM: number
  effectiveLevelMult: () => number
  runeEXPPerOffering: () => Decimal
  minimalResetTier: keyof typeof resetTiers
  effects: (n: number) => RuneBlessingTypeMap[K]
  effectsDescription: (n: number) => string
  name: () => string
}


const blessingMultiplier = (key: RuneKeys) => {
  return (
    runes[key].level + runes[key].freeLevels()
      * (1 + (6.9 * player.researches[134]) / 100)
      * (getTalismanEffects('midas').blessingBonus)
      * (1 + 0.1 * Math.log10(player.epicFragments + 1) * player.researches[174])
      * (1 + (2 * player.researches[194]) / 100)
      * (1 + 0.25 * player.researches[160])
      * G.challenge15Rewards.blessingBonus.value
  )
}

export const runeBlessings: { [K in RuneBlessingKeys]: RuneBlessingData<K> } = {
  speed: {
    level: 0,
    runeEXP: new Decimal(0),
    costCoefficient: new Decimal(1e8),
    levelsPerOOM: 25,
    effects: (level) => {
        const globalSpeed = 1 + level / 1000000
        return {
          globalSpeed
        }
    },
    effectsDescription: (level) => {
      const globalSpeed = runeBlessings.speed.effects(level).globalSpeed
      return i18next.t('runes.blessings.rewards.speed', {
        effect: format(globalSpeed, 3, true)
      })
    },
    effectiveLevelMult: () => blessingMultiplier('speed'),
    runeEXPPerOffering: () => calculateSalvageRuneEXPMultiplier(),
    minimalResetTier: 'singularity',
    name: () => i18next.t('runes.blessings.speed.name'),
  },
  duplication: {
    level: 0,
    runeEXP: new Decimal(0),
    costCoefficient: new Decimal(1e10),
    levelsPerOOM: 25,
    effects: (level) => {
      const multiplierBoosts = 1 + level / 1000000
      return {
        multiplierBoosts
      }
    },
    effectsDescription: (level) => {
        const multiplierBoosts = runeBlessings.duplication.effects(level).multiplierBoosts
        return i18next.t('runes.blessings.rewards.duplication', {
          effect: format(multiplierBoosts, 3, true)
        })
    },
    effectiveLevelMult: () => blessingMultiplier('duplication'),
    runeEXPPerOffering: () => calculateSalvageRuneEXPMultiplier(),
    minimalResetTier: 'singularity',
    name: () => i18next.t('runes.blessings.duplication.name'),
  },
  prism: {
    level: 0,
    runeEXP: new Decimal(0),
    costCoefficient: new Decimal(1e13),
    levelsPerOOM: 25,
    effects: (level) => {
        const antSacrificeMult = 1 + level / 1000000
        return {
            antSacrificeMult
        }
    },
    effectsDescription: (level) => {
      const antSacrificeMult = runeBlessings.prism.effects(level).antSacrificeMult
      return i18next.t('runes.blessings.rewards.prism', {
        effect: format(antSacrificeMult, 3, true)
      })
    },
    effectiveLevelMult: () => blessingMultiplier('prism'),
    runeEXPPerOffering: () => calculateSalvageRuneEXPMultiplier(),
    minimalResetTier: 'singularity',
    name: () => i18next.t('runes.blessings.prism.name'),
  },
  thrift: {
    level: 0,
    runeEXP: new Decimal(0),
    costCoefficient: new Decimal(1e16),
    levelsPerOOM: 25,
    effects: (level) => {
        const accelBoostCostDelay = 1 + level / 1000000
        return {
            accelBoostCostDelay
        }
    },
    effectsDescription: (level) => {
      const accelBoostCostDelay = runeBlessings.thrift.effects(level).accelBoostCostDelay
      return i18next.t('runes.blessings.rewards.thrift', {
        effect: format(accelBoostCostDelay, 3, true)
      })
    },
    effectiveLevelMult: () => blessingMultiplier('thrift'),
    runeEXPPerOffering: () => calculateSalvageRuneEXPMultiplier(),
    minimalResetTier: 'singularity',
    name: () => i18next.t('runes.blessings.thrift.name'),
  },
  superiorIntellect: {
    level: 0,
    runeEXP: new Decimal(0),
    costCoefficient: new Decimal(1e20),
    levelsPerOOM: 25,
    effects: (level) => {
      const obtToAntExponent = Math.log(1 + level / 1000000)
      return {
        obtToAntExponent
      }
    },
    effectsDescription: (level) => {
        const obtToAntExponent = runeBlessings.superiorIntellect.effects(level).obtToAntExponent
        return i18next.t('runes.blessings.rewards.superiorIntellect', {
          effect: format(obtToAntExponent, 3, true),
          effect2: format(Decimal.pow(player.obtainium, obtToAntExponent), 2, false)
        })
    },
    effectiveLevelMult: () => blessingMultiplier('superiorIntellect'),
    runeEXPPerOffering: () => calculateSalvageRuneEXPMultiplier(),
    minimalResetTier: 'singularity',
    name: () => i18next.t('runes.blessings.superiorIntellect.name')
  }
}

export const runeBlessingKeys = Object.keys(runeBlessings) as RuneBlessingKeys[]

export const getRuneBlessingPower = (bless: RuneBlessingKeys): number => {
    const blessingPowerMult = runeBlessings[bless].effectiveLevelMult()
    return runeBlessings[bless].level * blessingPowerMult
}
  
  export const getRuneBlessingEffect = <T extends RuneBlessingKeys>(bless: T): RuneBlessingTypeMap[T] => {
    return runeBlessings[bless].effects(getRuneBlessingPower(bless))
  }
  
  export const getRuneBlessingEXPPerOffering = (bless: RuneBlessingKeys): Decimal => {
    return runeBlessings[bless].runeEXPPerOffering()
  }
  
  const computeEXPToLevel = (bless: RuneBlessingKeys, level: number) => {
    const levelPerOOM = runeBlessings[bless].levelsPerOOM
    return runeBlessings[bless].costCoefficient.times(Decimal.pow(10, level / levelPerOOM).minus(1))
  }
  
  const computeEXPLeftToLevel = (bless: RuneBlessingKeys, level: number) => {
    return Decimal.max(0, computeEXPToLevel(bless, level).minus(runeBlessings[bless].runeEXP))
  }
  
  const computeOfferingsToLevel = (bless: RuneBlessingKeys, level: number) => {
    return Decimal.max(1, computeEXPLeftToLevel(bless, level).div(getRuneBlessingEXPPerOffering(bless)).ceil())
  }
  
  export const getRuneBlessingTNL = (bless: RuneBlessingKeys) => {
    return computeEXPLeftToLevel(bless, runeBlessings[bless].level + 1)
  }
  
  export const buyBlessingLevels = (blessing: RuneBlessingKeys, budget: Decimal) => {
    if (!achievementManager.getBonus('blessingUnlock')) {
      return
    }
  
    const levelsToAdd = player.runeBlessingBuyAmount
  
    levelBlessing(blessing, levelsToAdd, budget)
  }
  
  export const buyAllBlessingLevels = (budget: Decimal) => {
    const ratio = runeBlessingKeys.length
    for (const key of runeBlessingKeys) {
      buyBlessingLevels(key, Decimal.floor(budget.div(ratio)))
    }
  }

  export const levelBlessing = (bless: RuneBlessingKeys, timesLeveled: number, budget: Decimal) => {
    let budgetUsed: Decimal
  
    const expRequired = computeEXPLeftToLevel(bless, runeBlessings[bless].level + timesLeveled)
    const runeEXPPerOffering = getRuneBlessingEXPPerOffering(bless)
    const offeringsRequired = Decimal.max(1, expRequired.div(runeEXPPerOffering).ceil())
  
    if (offeringsRequired.gt(budget)) {
      runeBlessings[bless].runeEXP = runeBlessings[bless].runeEXP.add(budget.times(runeEXPPerOffering))
      budgetUsed = budget
    } else {
      runeBlessings[bless].runeEXP = runeBlessings[bless].runeEXP.add(offeringsRequired.times(runeEXPPerOffering))
      budgetUsed = offeringsRequired
    }
  
    player.offerings = player.offerings.sub(budgetUsed)
  
    // this.updatePlayerEXP()
    // this.updateRuneEffectHTML()
  }
  
  export const setBlessingLevel = (bless: RuneBlessingKeys, level: number) => {
    const exp = computeEXPToLevel(bless, level)
    runeBlessings[bless].level = level
    runeBlessings[bless].runeEXP = exp
  }
  
  const updateLevelsFromEXP = (bless: RuneBlessingKeys) => {
    const levelsPerOOM = runeBlessings[bless].levelsPerOOM
    const levels = Math.floor(levelsPerOOM * Decimal.log10(runeBlessings[bless].runeEXP.div(runeBlessings[bless].costCoefficient).plus(1)))
    runeBlessings[bless].level = levels
  }

  const getLevelEstimate = (bless: RuneBlessingKeys, offerings: Decimal) => {
    const runeEXPPerOffering = getRuneBlessingEXPPerOffering(bless)
    const totalEXP = runeBlessings[bless].runeEXP.plus(offerings.times(runeEXPPerOffering))
    return Math.floor(runeBlessings[bless].levelsPerOOM * Decimal.log10(totalEXP.div(runeBlessings[bless].costCoefficient).plus(1)))
  }
  
  export const updateAllBlessingLevelsFromEXP = () => {
    for (const bless of runeBlessingKeys) {
      updateLevelsFromEXP(bless)
    }
  }
  
  export const updateRuneBlessingHTML = (bless: RuneBlessingKeys) => {
    assert(G.currentTab === Tabs.Runes, 'current tab is not Runes')
    const levelsToDisplay = Math.min(
      player.runeBlessingBuyAmount,
      Math.max(1, getLevelEstimate(bless, player.offerings) - runeBlessings[bless].level)
    )

    DOMCacheGetOrSet(`${bless}RuneBlessingLevel`).innerHTML = `${
      i18next.t('runes.blessings.blessingLevel', {
        amount: format(runeBlessings[bless].level, 0, true)
      })
    } <br> ${i18next.t('runes.offeringInvested', { amount: format(runeBlessings[bless].runeEXP, 0, false) })}`
    DOMCacheGetOrSet(`${bless}RuneBlessingPurchase`).innerHTML = i18next.t('runes.blessings.increaseLevel', {
      amount: format(levelsToDisplay, 0, true),
      offerings: format(computeOfferingsToLevel(bless, runeBlessings[bless].level + levelsToDisplay), 0, false)
    })
    const blessingPower = getRuneBlessingPower(bless)
    DOMCacheGetOrSet(`${bless}RuneBlessingPower`).innerHTML = i18next.t('runes.blessings.blessingPower', {
      value: format(blessingPower, 0, true),
      desc: runeBlessings[bless].effectsDescription(blessingPower)
    })
  }
  
  export const updateRuneEffectHTML = (bless: RuneBlessingKeys) => {
    if (G.currentTab === Tabs.Runes) {
      DOMCacheGetOrSet(`${bless}RunePower`).innerHTML = runeBlessings[bless].effectsDescription(getRuneBlessingPower(bless))
    }
  }

  export function resetRuneBlessings (tier: keyof typeof resetTiers) {
    if (runeBlessings === null) {
      throw new Error('Rune Blessings not initialized. Call initRuneBlessings first.')
    }
    for (const bless of runeBlessingKeys) {
      if (resetTiers[tier] >= resetTiers[runeBlessings[bless].minimalResetTier]) {
        runeBlessings[bless].level = 0
        runeBlessings[bless].runeEXP = new Decimal(0)
      }
    }
  }
/*
export type RuneBlessingMap = {
  [K in RuneBlessingKeys]: RuneBlessing<K>
}

export let runeBlessings: RuneBlessingMap

export function initRuneBlessings (investments: Record<RuneBlessingKeys, Decimal>) {
  if (runeBlessings !== undefined) {
    for (const key of Object.keys(runeBlessings) as RuneBlessingKeys[]) {
      runeBlessings[key].updateRuneEXP(investments[key])
    }
  } else {
    const upgrades = {} as RuneBlessingMap
    const keys = Object.keys(runeBlessingData) as RuneBlessingKeys[]

    // Use type assertions after careful validation
    for (const key of keys) {
      const data = runeBlessingData[key]
      const invested = investments[key]

      const dataWithInvestment = {
        ...data,
        runeEXP: new Decimal(invested)
      }

      // Use a function that casts the result appropriately
      const rune = new RuneBlessing(dataWithInvestment, key) // Here we need to use type assertion because TypeScript can't track
       // the relationship between the key and the generic parameter in the loop
      ;(upgrades as Record<RuneBlessingKeys, RuneBlessing<RuneBlessingKeys>>)[key] = rune
    }

    runeBlessings = upgrades as RuneBlessingMap

    setInterval(() => achievementManager.tryUnlockByGroup('speedBlessing'), 1000)
  }
}

export function getRuneBlessing<K extends RuneBlessingKeys> (key: K): RuneBlessing<K> {
  if (runeBlessings === null) {
    throw new Error('Rune Blessings not initialized. Call initRuneBlessings first.')
  }
  return runeBlessings[key]
}

export function resetRuneBlessings (tier: keyof typeof resetTiers) {
  if (runeBlessings === null) {
    throw new Error('Rune Blessings not initialized. Call initRuneBlessings first.')
  }
  for (const runeBlessing of Object.values(runeBlessings)) {
    if (resetTiers[tier] >= resetTiers[runeBlessing.minimalResetTier]) {
      runeBlessing.resetRuneEXP()
    }
  }
}*/ 

