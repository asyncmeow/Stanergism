import {
  calculateOfferings,
  calculateRecycleMultiplier,
  calculateSigmoidExponential,
  isIARuneUnlocked
} from './Calculate'
import { format, player } from './Synergism'
import { Globals as G } from './Variables'

import Decimal from 'break_infinity.js'
import i18next from 'i18next'
import { DOMCacheGetOrSet } from './Cache/DOM'
import { formatAsPercentIncrease } from './Campaign'
import { CalcECC } from './Challenges'
import { PCoinUpgradeEffects } from './PseudoCoinUpgrades'
import { getTalisman, getTalismanBonus } from './Talismans'
import { productContents, sumContents } from './Utility'

export enum resetTiers {
  prestige = 1,
  transcension = 2,
  reincarnation = 3,
  ascension = 4,
  singularity = 5,
  never = 6
}

export const indexToRune: Record<number, RuneKeys> = {
  1: 'speed',
  2: 'duplication',
  3: 'prism',
  4: 'thrift',
  5: 'superiorIntellect',
  6: 'infiniteAscent',
  7: 'antiquities'
}

export const runeToIndex = Object.fromEntries(
  Object.entries(indexToRune).map(([key, value]) => [value as RuneKeys, key as unknown])
) as Record<RuneKeys, number>

interface BaseRuneData {
  costCoefficient: Decimal
  levelsPerOOM: number
  levelsPerOOMIncrease: () => number
  effectiveLevelMult: () => number
  freeLevels: () => number
  runeEXPPerOffering: (purchasedLevels: number) => Decimal
  isUnlocked: () => boolean
  minimalResetTier: keyof typeof resetTiers
  runeEXP?: Decimal
}

interface RuneData<T extends RuneKeys> extends BaseRuneData {
  rewards(this: void, level: number): RuneTypeMap[T]
}

interface RuneBlessingData<T extends RuneBlessingKeys> extends BaseRuneData {
  rewards(this: void, level: number): RuneBlessingTypeMap[T]
}

interface RuneSpiritData<T extends RuneSpiritKeys> extends BaseRuneData {
  rewards(this: void, level: number): RuneSpiritTypeMap[T]
}

interface BaseReward {
  desc: string
}

interface SpeedReward extends BaseReward {
  acceleratorPower: number
  multiplicativeAccelerators: number
  globalSpeed: number
}

interface DuplicationReward extends BaseReward {
  multiplierBoosts: number
  multiplicativeMultipliers: number
  taxReduction: number
}

interface PrismReward extends BaseReward {
  productionLog10: number
  costDivisorLog10: number
}

interface ThriftReward extends BaseReward {
  costDelay: number
  recycleChance: number
  taxReduction: number
}

interface SIReward extends BaseReward {
  offeringMult: number
  obtainiumMult: number
  antSpeed: number
}

interface IAReward extends BaseReward {
  quarkMult: number
  cubeMult: number
}

interface AntiquitiesReward extends BaseReward {
  addCodeCooldownReduction: number
}

interface HorseshoeReward extends BaseReward {
  ambrosiaLuck: number
  redLuck: number
  redLuckConversion: number
}

type RuneTypeMap = {
  speed: SpeedReward
  duplication: DuplicationReward
  prism: PrismReward
  thrift: ThriftReward
  superiorIntellect: SIReward
  infiniteAscent: IAReward
  antiquities: AntiquitiesReward
  horseShoe: HorseshoeReward
}

export type RuneKeys = keyof RuneTypeMap

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

    this.runeEXP = new Decimal().fromDecimal(data.runeEXP ?? new Decimal('0'))
  }

  get effectiveLevelsPerOOM () {
    return this.levelsPerOOM + this.levelsPerOOMIncrease()
  }

  get level (): number {
    return Math.floor(this.effectiveLevelsPerOOM * Decimal.log10(this.runeEXP.div(this.costCoefficient).plus(1)))
  }

  get TNL (): Decimal {
    const lvl = this.level
    const expReq = this.computeEXPToLevel(lvl + 1)
    return Decimal.max(0, expReq.sub(this.runeEXP))
  }

  get effectiveRuneLevel (): number {
    if (player.currentChallenge.reincarnation === 9 && resetTiers[this.minimalResetTier] < resetTiers.singularity) {
      return 1
    }

    return (this.level + this.freeLevels) * this.effectiveLevelMult()
  }

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
    this.runeEXP = new Decimal().fromDecimal(exp)
    console.log(this.key, this.runeEXP)
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

  levelRune (timesLeveled: number, budget: Decimal, auto = false) {
    let budgetUsed = new Decimal(0)

    const expRequired = this.computeEXPLeftToLevel(this.level + timesLeveled)
    const offeringsRequired = Decimal.max(1, expRequired.div(this.perOfferingEXP).ceil())

    if (!auto) {
      console.log('offerings required', offeringsRequired.toNumber())
      console.log('EXP required', expRequired.toNumber())
    }

    if (offeringsRequired.gt(budget)) {
      this.addRuneEXP(new Decimal(budget))
      budgetUsed = budget
    } else {
      this.addRuneEXP(offeringsRequired)
      budgetUsed = offeringsRequired
    }

    if (!auto) {
      console.log('used budget', budgetUsed)
    }
    player.offerings = player.offerings.sub(budgetUsed)

    this.updatePlayerEXP()
    this.updateRuneHTML()
    this.updateRuneEffectHTML()

    if (!auto) {
      this.updateFocusedRuneHTML()
    }
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
    return this.bonus.desc
  }

  get bonus () {
    if (!this.isUnlocked) {
      return this.rewards(0)
    }
    return this.rewards(this.effectiveRuneLevel)
  }

  updatePlayerEXP (): void {
    if (player.runes && this.key in player.runes) {
      player.runes[this.key as RuneKeys] = new Decimal().fromDecimal(this.runeEXP)
    } else {
      console.error(`Player object does not have a property for ${this.key}.`)
    }
  }

  updateRuneHTML () {
    DOMCacheGetOrSet(`${this.key}RuneLevel`).textContent = i18next.t('runes.level', { x: format(this.level, 0, true) })
    DOMCacheGetOrSet(`${this.key}RuneFreeLevel`).textContent = i18next.t('runes.freeLevels', {
      x: format(this.freeLevels, 0, true)
    })
    DOMCacheGetOrSet(`${this.key}RuneTNL`).textContent = i18next.t('runes.TNL', { EXP: format(this.TNL, 2, false) })
  }

  updateFocusedRuneHTML () {
    DOMCacheGetOrSet('focusedRuneName').textContent = this.name
    DOMCacheGetOrSet('focusedRuneDescription').textContent = this.description
    DOMCacheGetOrSet('focusedRuneValues').textContent = this.valueText
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
    DOMCacheGetOrSet(`${this.key}RunePower`).textContent = this.rewardDesc
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
    return this.bonus.desc
  }

  get bonus () {
    if (!this.isUnlocked) {
      return this.rewards(0)
    }
    return this.rewards(this.effectiveRuneLevel)
  }

  updatePlayerEXP (): void {
    if (player.runeBlessings && this.key in player.runeBlessings) {
      player.runeBlessings[this.key as RuneBlessingKeys] = new Decimal().fromDecimal(this.runeEXP)
    } else {
      console.error(`Player object does not have a property for ${this.key} in Blessings.`)
    }
  }

  updateRuneHTML () {
    const levelsToDisplay = Math.min(player.runeBlessingBuyAmount, this.getLevelEstimate(player.offerings) - this.level)

    DOMCacheGetOrSet(`${this.key}RuneBlessingLevel`).innerHTML = i18next.t('runes.blessings.blessingLevel', {
      amount: format(this.level, 0, true)
    })
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
    return this.bonus.desc
  }

  get bonus () {
    if (!this.isUnlocked) {
      return this.rewards(0)
    }
    return this.rewards(this.effectiveRuneLevel)
  }

  updatePlayerEXP (): void {
    if (player.runeSpirits && this.key in player.runeSpirits) {
      player.runeSpirits[this.key as RuneSpiritKeys] = new Decimal().fromDecimal(this.runeEXP)
    } else {
      console.error(`Player object does not have a property for ${this.key} in Spirits.`)
    }
  }

  updateRuneHTML () {
    const levelsToDisplay = Math.min(player.runeSpiritBuyAmount, this.getLevelEstimate(player.offerings) - this.level)

    DOMCacheGetOrSet(`${this.key}RuneSpiritLevel`).innerHTML = i18next.t('runes.spirits.spiritLevel', {
      amount: format(this.level, 0, true)
    })
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
}

export const firstFiveFreeLevels = () => {
  return sumContents([
    Math.min(1e3, player.antUpgrades[8] ?? 0 + G.bonusant9),
    7 * Math.min(player.constantUpgrades[7], 1000)
  ])
}

export const bonusRuneLevelsSpeed = () => {
  return sumContents([
    getTalismanBonus('speed'),
    player.upgrades[27] * (Math.min(50, Math.floor(Decimal.log(player.coins.add(1), 1e10)))
      + Math.max(0, Math.min(50, Math.floor(Decimal.log(player.coins.add(1), 1e50)) - 10))),
    player.upgrades[29] * Math.floor(
      Math.min(
        100,
        (player.firstOwnedCoin + player.secondOwnedCoin + player.thirdOwnedCoin + player.fourthOwnedCoin
          + player.fifthOwnedCoin) / 400
      )
    )
  ])
}

export const bonusRuneLevelsDuplication = () => {
  return sumContents([
    getTalismanBonus('duplication'),
    player.upgrades[28] * Math.min(
      100,
      Math.floor(
        (player.firstOwnedCoin + player.secondOwnedCoin + player.thirdOwnedCoin + player.fourthOwnedCoin
          + player.fifthOwnedCoin) / 400
      )
    ),
    player.upgrades[30] * (Math.min(50, Math.floor(Decimal.log(player.coins.add(1), 1e30)))
      + Math.min(50, Math.floor(Decimal.log(player.coins.add(1), 1e300))))
  ])
}

export const bonusRuneLevelsPrism = () => {
  return sumContents([
    getTalismanBonus('prism')
  ])
}

export const bonusRuneLevelsThrift = () => {
  return sumContents([
    getTalismanBonus('thrift')
  ])
}

export const bonusRuneLevelsSI = () => {
  return sumContents([
    getTalismanBonus('superiorIntellect')
  ])
}

export const bonusRuneLevelsIA = () => {
  return sumContents([
    PCoinUpgradeEffects.INSTANT_UNLOCK_2 ? 6 : 0,
    player.cubeUpgrades[73],
    player.campaigns.bonusRune6,
    getTalismanBonus('infiniteAscent')
  ])
}

export const bonusRuneLevelsAntiquities = () => {
  return 0
}

export const speedRuneOOMIncrease = () => {
  return sumContents([
    player.upgrades[66] * 2,
    player.researches[77],
    player.researches[111],
    CalcECC('ascension', player.challengecompletions[11]),
    1.5 * CalcECC('ascension', player.challengecompletions[14]),
    player.cubeUpgrades[16],
    getTalisman('chronos').bonus.speedOOMBonus
  ])
}

export const duplicationRuneOOMIncrease = () => {
  return sumContents([
    0.75 * CalcECC('transcend', player.challengecompletions[1]),
    player.upgrades[66] * 2,
    player.researches[78],
    player.researches[112],
    CalcECC('ascension', player.challengecompletions[11]),
    1.5 * CalcECC('ascension', player.challengecompletions[14]),
    getTalisman('exemption').bonus.duplicationOOMBonus
  ])
}

export const prismRuneOOMIncrease = () => {
  return sumContents([
    player.upgrades[66] * 2,
    player.researches[79],
    player.researches[113],
    CalcECC('ascension', player.challengecompletions[11]),
    1.5 * CalcECC('ascension', player.challengecompletions[14]),
    player.cubeUpgrades[16],
    getTalisman('mortuus').bonus.prismOOMBonus
  ])
}

export const thriftRuneOOMIncrease = () => {
  return sumContents([
    player.upgrades[66] * 2,
    player.researches[80],
    player.researches[114],
    CalcECC('ascension', player.challengecompletions[11]),
    1.5 * CalcECC('ascension', player.challengecompletions[14]),
    player.cubeUpgrades[37],
    getTalisman('midas').bonus.thriftOOMBonus
  ])
}

export const superiorIntellectOOMIncrease = () => {
  return sumContents([
    player.upgrades[66] * 2,
    player.researches[115],
    CalcECC('ascension', player.challengecompletions[11]),
    1.5 * CalcECC('ascension', player.challengecompletions[14]),
    player.cubeUpgrades[37],
    getTalisman('polymath').bonus.SIOOMBonus
  ])
}

export const firstFiveEffectiveRuneLevelMult = () => {
  return productContents([
    1 + player.researches[4] / 10 * CalcECC('ascension', player.challengecompletions[14]), // Research 1x4
    1 + player.researches[21] / 100, // Research 2x6
    1 + player.researches[90] / 100, // Research 4x15
    1 + player.researches[131] / 200, // Research 6x6
    1 + ((player.researches[161] / 200) * 3) / 5, // Research 7x11
    1 + ((player.researches[176] / 200) * 2) / 5, // Research 8x1
    1 + ((player.researches[191] / 200) * 1) / 5, // Research 8x16
    1 + ((player.researches[146] / 200) * 4) / 5, // Research 6x21
    1 + ((0.01 * Math.log(player.talismanShards + 1)) / Math.log(4))
      * Math.min(1, player.constantUpgrades[9]), // Constant Upgrade 9
    G.challenge15Rewards.runeBonus.value,
    G.cubeBonusMultiplier[9] // Midas Tribute
  ])
}

export const universalRuneEXPMult = (purchasedLevels: number): Decimal => {
  // recycleMult accounted for all recycle chance, but inversed so it's a multiplier instead
  const recycleMultiplier = calculateRecycleMultiplier()

  // Rune multiplier that is summed instead of added
  /* TODO: Replace the effects of these upgrades with new ones
    const allRuneExpAdditiveMultiplier = sumContents([
        // Challenge 3 completions
        (1 / 100) * player.highestchallengecompletions[3],
        // Reincarnation 2x1
        1 * player.upgrades[66]
      ])
    }*/
  const allRuneExpAdditiveMultiplier = sumContents([
    // Base amount multiplied per offering
    1,
    // +1 if C1 completion
    Math.min(1, player.highestchallengecompletions[1]),
    // +0.10 per C1 completion
    (0.4 / 10) * player.highestchallengecompletions[1],
    // Research 5x2
    0.6 * player.researches[22],
    // Research 5x3
    0.3 * player.researches[23],
    // Particle Upgrade 1x1
    2 * player.upgrades[61],
    // Particle upgrade 3x1
    (player.upgrades[71] * purchasedLevels) / 25
  ])

  // Rune multiplier that gets applied to all runes
  const allRuneExpMultiplier = [
    // Research 4x16
    1 + player.researches[91] / 20,
    // Research 4x17
    1 + player.researches[92] / 20,
    // Ant 8
    calculateSigmoidExponential(
      999,
      (1 / 10000) * Math.pow(player.antUpgrades[8 - 1]! + G.bonusant8, 1.1)
    ),
    // Cube Bonus
    G.cubeBonusMultiplier[4],
    // Cube Upgrade Bonus
    1 + (player.ascensionCounter / 1000) * player.cubeUpgrades[32],
    // Constant Upgrade Multiplier
    1 + (1 / 10) * player.constantUpgrades[8],
    // Challenge 15 reward multiplier
    G.challenge15Rewards.runeExp.value
  ].reduce((x, y) => x.times(y), new Decimal('1'))

  return allRuneExpMultiplier.times(allRuneExpAdditiveMultiplier).times(recycleMultiplier)
}

export const speedEXPMult = () => {
  return [
    1 + CalcECC('reincarnation', player.challengecompletions[7]) / 10,
    player.corruptions.used.corruptionEffects('drought')
  ].reduce((x, y) => x.times(y), new Decimal('1'))
}

export const duplicationEXPMult = () => {
  return [
    1 + CalcECC('reincarnation', player.challengecompletions[7]) / 10,
    player.corruptions.used.corruptionEffects('drought')
  ].reduce((x, y) => x.times(y), new Decimal('1'))
}

export const prismEXPMult = () => {
  return [
    1 + CalcECC('reincarnation', player.challengecompletions[8]) / 5,
    player.corruptions.used.corruptionEffects('drought')
  ].reduce((x, y) => x.times(y), new Decimal('1'))
}

export const thriftEXPMult = () => {
  return [
    1 + CalcECC('reincarnation', player.challengecompletions[6]) / 10,
    player.corruptions.used.corruptionEffects('drought')
  ].reduce((x, y) => x.times(y), new Decimal('1'))
}

export const superiorIntellectEXPMult = () => {
  return [
    1 + CalcECC('reincarnation', player.challengecompletions[9]) / 5,
    player.corruptions.used.corruptionEffects('drought')
  ].reduce((x, y) => x.times(y), new Decimal('1'))
}

export const infiniteAscentEXPMult = () => {
  return new Decimal('1')
}

export const antiquitiesEXPMult = () => {
  return new Decimal('1')
}

export const runeData: { [K in RuneKeys]: RuneData<K> } = {
  speed: {
    costCoefficient: new Decimal(500),
    levelsPerOOM: 150,
    levelsPerOOMIncrease: () => speedRuneOOMIncrease(),
    rewards: (level) => {
      const acceleratorPower = 0.0002 * level
      const multiplicativeAccelerators = 1 + level / 400
      const globalSpeed = 2 - Math.exp(-Math.cbrt(level) / 100)
      return {
        desc: i18next.t('runes.speed.effect', {
          val: format(100 * acceleratorPower, 2, true),
          val2: formatAsPercentIncrease(multiplicativeAccelerators, 2),
          val3: formatAsPercentIncrease(globalSpeed, 2)
        }),
        acceleratorPower: acceleratorPower,
        multiplicativeAccelerators: multiplicativeAccelerators,
        globalSpeed: globalSpeed
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsSpeed(),
    runeEXPPerOffering: (purchasedLevels) => universalRuneEXPMult(purchasedLevels).times(speedEXPMult()),
    isUnlocked: () => true,
    minimalResetTier: 'ascension'
  },
  duplication: {
    costCoefficient: new Decimal(2500),
    levelsPerOOM: 150,
    levelsPerOOMIncrease: () => duplicationRuneOOMIncrease(),
    rewards: (level) => {
      const multiplierBoosts = level / 5
      const multiplicativeMultipliers = 1 + level / 400
      const taxReduction = 0.001 + .999 * Math.exp(-Math.cbrt(level) / 10)
      return {
        desc: i18next.t('runes.duplication.effect', {
          val: format(multiplierBoosts, 2, true),
          val2: formatAsPercentIncrease(multiplicativeMultipliers, 2),
          val3: format(100 * (1 - taxReduction), 3, true)
        }),
        multiplierBoosts: multiplierBoosts,
        multiplicativeMultipliers: multiplicativeMultipliers,
        taxReduction: taxReduction
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsDuplication(),
    runeEXPPerOffering: (purchasedLevels) => universalRuneEXPMult(purchasedLevels).times(duplicationEXPMult()),
    isUnlocked: () => player.achievements[38] > 0,
    minimalResetTier: 'ascension'
  },
  prism: {
    costCoefficient: new Decimal(2.5e4),
    levelsPerOOM: 150,
    levelsPerOOMIncrease: () => prismRuneOOMIncrease(),
    rewards: (level) => {
      const productionLog10 = Math.max(0, 2 * Math.log10(1 + level / 2) + (level / 2) * Math.log10(2) - Math.log10(256))
      const costDivisorLog10 = Math.floor(level / 10)
      return {
        desc: i18next.t('runes.prism.effect', {
          val: format(Decimal.pow(10, productionLog10), 2, true),
          val2: format(Decimal.pow(10, costDivisorLog10), 2, true)
        }),
        productionLog10: productionLog10,
        costDivisorLog10: costDivisorLog10
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsPrism(),
    runeEXPPerOffering: (purchasedLevels) => universalRuneEXPMult(purchasedLevels).times(prismEXPMult()),
    isUnlocked: () => player.achievements[44] > 0,
    minimalResetTier: 'ascension'
  },
  thrift: {
    costCoefficient: new Decimal(2.5e5),
    levelsPerOOM: 150,
    levelsPerOOMIncrease: () => thriftRuneOOMIncrease(),
    rewards: (level) => {
      const costDelay = Math.min(1e15, level / 125)
      const recycleChance = 0.25 * (1 - Math.exp(-Math.sqrt(level) / 100))
      const taxReduction = 0.01 + 0.99 * Math.exp(-Math.cbrt(level) / 20)
      return {
        desc: i18next.t('runes.thrift.effect', {
          val: format(costDelay, 2, true),
          val2: format(100 * recycleChance, 3, true),
          val3: format(100 * (1 - taxReduction), 2, true)
        }),
        costDelay: costDelay,
        recycleChance: recycleChance,
        taxReduction: taxReduction
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsThrift(),
    runeEXPPerOffering: (purchasedLevels) => universalRuneEXPMult(purchasedLevels).times(thriftEXPMult()),
    isUnlocked: () => player.achievements[102] > 0,
    minimalResetTier: 'ascension'
  },
  superiorIntellect: {
    costCoefficient: new Decimal(2.5e7),
    levelsPerOOM: 150,
    levelsPerOOMIncrease: () => superiorIntellectOOMIncrease(),
    rewards: (level) => {
      const offeringMult = 1 + level / 2000
      const obtainiumMult = 1 + level / 200
      const antSpeed = 1 + Math.pow(level, 2) / 2500
      return {
        desc: i18next.t('runes.superiorIntellect.effect', {
          val: format(offeringMult, 3, true),
          val2: format(obtainiumMult, 3, true),
          val3: format(antSpeed, 3, true)
        }),
        offeringMult: offeringMult,
        obtainiumMult: obtainiumMult,
        antSpeed: antSpeed
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsSI(),
    runeEXPPerOffering: (purchasedLevels) => universalRuneEXPMult(purchasedLevels).times(superiorIntellectEXPMult()),
    isUnlocked: () => player.researches[82] > 0,
    minimalResetTier: 'ascension'
  },
  infiniteAscent: {
    costCoefficient: new Decimal(1e75),
    levelsPerOOM: 0.5,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const quarkMult = 1.1 + level / 500
      const cubeMult = 1 + level / 100
      return {
        desc: i18next.t('runes.infiniteAscent.effect', {
          val: formatAsPercentIncrease(quarkMult, 2),
          val2: formatAsPercentIncrease(cubeMult, 2)
        }),
        quarkMult: quarkMult,
        cubeMult: cubeMult
      }
    },
    effectiveLevelMult: () => 1,
    freeLevels: () => bonusRuneLevelsIA(),
    runeEXPPerOffering: (purchasedLevels) => universalRuneEXPMult(purchasedLevels).times(infiniteAscentEXPMult()),
    isUnlocked: () => isIARuneUnlocked(),
    minimalResetTier: 'singularity'
  },
  antiquities: {
    costCoefficient: new Decimal(1e206),
    levelsPerOOM: 1 / 50,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const addCodeCooldownReduction = level > 0 ? 0.8 - 0.3 * (level - 1) / (level + 10) : 1
      return {
        desc: i18next.t('runes.antiquities.effect', { val: format(100 * addCodeCooldownReduction, 2, true) }),
        addCodeCooldownReduction: addCodeCooldownReduction
      }
    },
    effectiveLevelMult: () => 1,
    freeLevels: () => bonusRuneLevelsAntiquities(),
    runeEXPPerOffering: (purchasedLevels) => universalRuneEXPMult(purchasedLevels).times(antiquitiesEXPMult()),
    isUnlocked: () => player.platonicUpgrades[20] > 0,
    minimalResetTier: 'singularity'
  },
  horseShoe: {
    costCoefficient: new Decimal('1e500'),
    levelsPerOOM: 1 / 16,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const ambrosiaLuck = 5 * level
      const redLuck = level
      const redLuckConversion = -0.5 * level / (level + 50)
      return {
        desc: i18next.t('runes.horseShoe.effect', {
          val: format(ambrosiaLuck, 0, true),
          val2: format(redLuck, 0, true),
          val3: format(redLuckConversion, 3, false)
        }),
        ambrosiaLuck: ambrosiaLuck,
        redLuck: redLuck,
        redLuckConversion: redLuckConversion
      }
    },
    effectiveLevelMult: () => 1,
    freeLevels: () => 0,
    runeEXPPerOffering: (purchasedLevels) => universalRuneEXPMult(purchasedLevels),
    isUnlocked: () => player.platonicUpgrades[20] > 0,
    minimalResetTier: 'singularity'
  }
}

export type RunesMap = {
  [K in RuneKeys]: Rune<K>
}

export let runes: RunesMap

export function initRunes (investments: Record<RuneKeys, Decimal>) {
  if (runes !== undefined) {
    console.log(runes)
    for (const key of Object.keys(runes) as RuneKeys[]) {
      runes[key].updateRuneEXP(investments[key])
    }
  } else {
    const upgrades = {} as RunesMap
    const keys = Object.keys(runeData) as RuneKeys[]

    // Use type assertions after careful validation
    for (const key of keys) {
      const data = runeData[key]
      const invested = investments[key]

      const dataWithInvestment = {
        ...data,
        runeEXP: new Decimal(invested)
      }

      // Use a function that casts the result appropriately
      const rune = new Rune(dataWithInvestment, key) // Here we need to use type assertion because TypeScript can't track
       // the relationship between the key and the generic parameter in the loop
      ;(upgrades as Record<RuneKeys, Rune<RuneKeys>>)[key] = rune
    }

    runes = upgrades as RunesMap
  }
}

export function getRune<K extends RuneKeys> (key: K): Rune<K> {
  if (runes === null) {
    throw new Error('Runes not initialized. Call initRunes first.')
  }
  return runes[key]
}

export function sumOfRuneLevels () {
  if (runes === null) {
    throw new Error('Runes not initialized. Call initRunes first.')
  }
  return Object.values(runes).reduce((sum, rune) => sum + rune.level + rune.freeLevels, 0)
}

export function getNumberUnlockedRunes () {
  if (runes === null) {
    throw new Error('Runes not initialized. Call initRunes first.')
  }
  return Object.values(runes).filter((rune) => rune.isUnlocked).length
}

export function resetRunes (tier: keyof typeof resetTiers) {
  if (runes === null) {
    throw new Error('Runes not initialized. Call initRunes first.')
  }
  for (const rune of Object.values(runes)) {
    if (resetTiers[tier] >= resetTiers[rune.minimalResetTier]) {
      rune.resetRuneEXP()
    }

    if (resetTiers[tier] === resetTiers[rune.minimalResetTier] && tier === 'ascension') {
      rune.setToLevel(3 * player.cubeUpgrades[26])
    }
  }
}

export const generateRunesHTML = () => {
  const alreadyGenerated = document.getElementsByClassName('runeType').length > 0

  if (alreadyGenerated) {
    return
  } else {
    const runeContainer = DOMCacheGetOrSet('runeDetails')

    for (const key of Object.keys(runeData) as RuneKeys[]) {
      const runesDiv = document.createElement('div')
      runesDiv.className = 'runeType'
      runesDiv.id = `${key}RuneContainer`

      const runeName = document.createElement('p')
      runeName.className = 'runeTypeElement'
      runeName.setAttribute('i18n', `runes.${key}.name`)
      runeName.textContent = i18next.t(`runes.${key}.name`)

      runesDiv.appendChild(runeName)

      const runeIcon = document.createElement('img')
      runeIcon.className = 'runeImage'
      runeIcon.id = `${key}Rune`
      runeIcon.alt = `${key} Rune`
      runeIcon.src = `Pictures/Runes/${key.charAt(0).toUpperCase() + key.slice(1)}.png`
      runeIcon.loading = 'lazy'

      runesDiv.appendChild(runeIcon)

      const runeLevel = document.createElement('span')
      runeLevel.className = 'runeTypeElement'
      runeLevel.id = `${key}RuneLevel`
      runeLevel.textContent = 'Level 0/30'

      runesDiv.appendChild(runeLevel)

      const runeFreeLevel = document.createElement('span')
      runeFreeLevel.className = 'runeTypeElement'
      runeFreeLevel.id = `${key}RuneFreeLevel`
      runeFreeLevel.textContent = '0'
      runeFreeLevel.style.color = 'orange'

      runesDiv.appendChild(runeFreeLevel)

      const runeTNL = document.createElement('span')
      runeTNL.className = 'runeTypeElement'
      runeTNL.id = `${key}RuneTNL`
      runeTNL.textContent = '0'
      runesDiv.appendChild(runeTNL)

      const sacrificeButton = document.createElement('button')
      sacrificeButton.className = 'runeTypeElement'
      sacrificeButton.id = `${key}RuneSacrifice`
      sacrificeButton.setAttribute('i18n', 'general.sacrificeCapital')
      sacrificeButton.textContent = i18next.t('general.sacrificeCapital')

      runesDiv.appendChild(sacrificeButton)

      runeContainer.appendChild(runesDiv)
    }
  }
}

/** Blessings */

interface SpeedBlessingReward extends BaseReward {
  globalSpeed: number
}

interface DuplicationBlessingReward extends BaseReward {
  multiplierBoosts: number
}

interface PrismBlessingReward extends BaseReward {
  antSacrificeMult: number
}

interface ThriftBlessingReward extends BaseReward {
  accelBoostCostDelay: number
}

interface SIBlessingReward extends BaseReward {
  obtToAntExponent: number
}

type RuneBlessingTypeMap = {
  speed: SpeedBlessingReward
  duplication: DuplicationBlessingReward
  prism: PrismBlessingReward
  thrift: ThriftBlessingReward
  superiorIntellect: SIBlessingReward
}

export type RuneBlessingKeys = keyof RuneBlessingTypeMap

const blessingMultiplier = (key: RuneKeys) => {
  return productContents([
    getRune(key).level + getRune(key).freeLevels,
    1 + (6.9 * player.researches[134]) / 100,
    getTalisman('midas').bonus.blessingBonus,
    1 + 0.1 * Math.log10(player.epicFragments + 1) * player.researches[174],
    1 + (2 * player.researches[194]) / 100,
    1 + 0.25 * player.researches[160],
    G.challenge15Rewards.blessingBonus.value
  ])
}

export const runeBlessingData: { [K in RuneBlessingKeys]: RuneBlessingData<K> } = {
  speed: {
    costCoefficient: new Decimal(1e8),
    levelsPerOOM: 25,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const globalSpeed = 1 + level / 10000
      return {
        desc: i18next.t('runes.blessings.rewards.speed', {
          effect: format(globalSpeed, 3, true)
        }),
        globalSpeed
      }
    },
    effectiveLevelMult: () => blessingMultiplier('speed'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  },
  duplication: {
    costCoefficient: new Decimal(1e10),
    levelsPerOOM: 25,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const multiplierBoosts = 1 + level / 10000
      return {
        desc: i18next.t('runes.blessings.rewards.duplication', {
          effect: format(multiplierBoosts, 3, true)
        }),
        multiplierBoosts
      }
    },
    effectiveLevelMult: () => blessingMultiplier('duplication'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  },
  prism: {
    costCoefficient: new Decimal(1e13),
    levelsPerOOM: 25,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const antSacrificeMult = 1 + level / 10000
      return {
        desc: i18next.t('runes.blessings.rewards.prism', {
          effect: format(antSacrificeMult, 3, true)
        }),
        antSacrificeMult
      }
    },
    effectiveLevelMult: () => blessingMultiplier('prism'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  },
  thrift: {
    costCoefficient: new Decimal(1e16),
    levelsPerOOM: 25,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const accelBoostCostDelay = 1 + level / 10000
      return {
        desc: i18next.t('runes.blessings.rewards.thrift', {
          effect: format(accelBoostCostDelay, 3, true)
        }),
        accelBoostCostDelay
      }
    },
    effectiveLevelMult: () => blessingMultiplier('thrift'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  },
  superiorIntellect: {
    costCoefficient: new Decimal(1e20),
    levelsPerOOM: 25,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const obtToAntExponent = Math.log(1 + level / 10000)
      return {
        desc: i18next.t('runes.blessings.rewards.superiorIntellect', {
          effect: format(obtToAntExponent, 3, true),
          effect2: format(Decimal.pow(player.obtainium, obtToAntExponent), 2, false)
        }),
        obtToAntExponent
      }
    },
    effectiveLevelMult: () => blessingMultiplier('superiorIntellect'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  }
}

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
}

/** Spirits */

interface SpeedSpiritReward extends BaseReward {
  ascensionSpeed: number
}

interface DuplicationSpiritReward extends BaseReward {
  wowCubes: number
}

interface PrismSpiritReward extends BaseReward {
  crystalCaps: number
}

interface ThriftSpiritReward extends BaseReward {
  offerings: number
}

interface SISpiritReward extends BaseReward {
  obtainium: number
}

type RuneSpiritTypeMap = {
  speed: SpeedSpiritReward
  duplication: DuplicationSpiritReward
  prism: PrismSpiritReward
  thrift: ThriftSpiritReward
  superiorIntellect: SISpiritReward
}

export type RuneSpiritKeys = keyof RuneSpiritTypeMap

const spiritMultiplier = (key: RuneKeys) => {
  return productContents([
    getRune(key).level + getRune(key).freeLevels,
    getRuneBlessing(key as RuneBlessingKeys).level,
    1 + (8 * player.researches[164]) / 100,
    (player.researches[165] && player.currentChallenge.ascension !== 0) ? 2 : 1,
    1 + 0.15 * Math.log10(player.legendaryFragments + 1) * player.researches[189],
    1 + (2 * player.researches[194]) / 100,
    G.challenge15Rewards.spiritBonus.value,
    player.corruptions.used.totalCorruptionDifficultyMultiplier
  ])
}

export const runeSpiritData: { [K in RuneSpiritKeys]: RuneSpiritData<K> } = {
  speed: {
    costCoefficient: new Decimal(1e20),
    levelsPerOOM: 12,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const ascensionSpeed = Math.pow(1 + Math.log(1 + level / 1e8), 1.25)
      return {
        desc: i18next.t('runes.spirits.rewards.speed', {
          effect: format(ascensionSpeed, 3, true)
        }),
        ascensionSpeed
      }
    },
    effectiveLevelMult: () => spiritMultiplier('speed'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  },
  duplication: {
    costCoefficient: new Decimal(1e25),
    levelsPerOOM: 12,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const wowCubes = 1 + level / 1000000
      return {
        desc: i18next.t('runes.spirits.rewards.duplication', {
          effect: format(wowCubes, 3, true)
        }),
        wowCubes
      }
    },
    effectiveLevelMult: () => spiritMultiplier('duplication'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  },
  prism: {
    costCoefficient: new Decimal(1e30),
    levelsPerOOM: 12,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const crystalCaps = 1 + level / 1000000
      return {
        desc: i18next.t('runes.spirits.rewards.prism', {
          effect: format(crystalCaps, 3, true)
        }),
        crystalCaps
      }
    },
    effectiveLevelMult: () => spiritMultiplier('prism'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  },
  thrift: {
    costCoefficient: new Decimal(1e35),
    levelsPerOOM: 12,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const offerings = 1 + level / 1000000
      return {
        desc: i18next.t('runes.spirits.rewards.thrift', {
          effect: format(offerings, 3, true)
        }),
        offerings
      }
    },
    effectiveLevelMult: () => spiritMultiplier('thrift'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  },
  superiorIntellect: {
    costCoefficient: new Decimal(1e40),
    levelsPerOOM: 12,
    levelsPerOOMIncrease: () => 0,
    rewards: (level) => {
      const obtainium = 1 + level / 1000000
      return {
        desc: i18next.t('runes.spirits.rewards.superiorIntellect', {
          effect: format(obtainium, 3, true)
        }),
        obtainium
      }
    },
    effectiveLevelMult: () => spiritMultiplier('superiorIntellect'),
    freeLevels: () => 0,
    runeEXPPerOffering: (_purchasedLevels) => new Decimal(1),
    isUnlocked: () => true,
    minimalResetTier: 'singularity'
  }
}

export type RuneSpiritMap = {
  [K in RuneSpiritKeys]: RuneSpirit<K>
}

export let runeSpirits: RuneSpiritMap

export function initRuneSpirits (investments: Record<RuneSpiritKeys, Decimal>) {
  if (runeSpirits !== undefined) {
    for (const key of Object.keys(runeSpirits) as RuneSpiritKeys[]) {
      runeSpirits[key].updateRuneEXP(investments[key])
    }
  } else {
    const upgrades = {} as RuneSpiritMap
    const keys = Object.keys(runeSpiritData) as RuneSpiritKeys[]

    // Use type assertions after careful validation
    for (const key of keys) {
      const data = runeSpiritData[key]
      const invested = investments[key]

      const dataWithInvestment = {
        ...data,
        runeEXP: new Decimal(invested)
      }

      // Use a function that casts the result appropriately
      const rune = new RuneSpirit(dataWithInvestment, key) // Here we need to use type assertion because TypeScript can't track
       // the relationship between the key and the generic parameter in the loop
      ;(upgrades as Record<RuneSpiritKeys, RuneSpirit<RuneSpiritKeys>>)[key] = rune
    }

    runeSpirits = upgrades as RuneSpiritMap
  }
}

export function getRuneSpirit<K extends RuneSpiritKeys> (key: K): RuneSpirit<K> {
  if (runeSpirits === null) {
    throw new Error('Rune Spirits not initialized. Call initRuneSpirits first.')
  }
  return runeSpirits[key]
}

export function resetRuneSpirits (tier: keyof typeof resetTiers) {
  if (runeSpirits === null) {
    throw new Error('Rune Spirits not initialized. Call initRuneSpirits first.')
  }
  for (const spirit of Object.values(runeSpirits)) {
    if (resetTiers[tier] >= resetTiers[spirit.minimalResetTier]) {
      spirit.resetRuneEXP()
    }
  }
}

export const resetOfferings = () => {
  player.offerings = player.offerings.add(calculateOfferings())
}

export const sacrificeOfferings = (rune: RuneKeys, budget: Decimal, auto = false) => {
  // if automated && 2x10 cube upgrade bought, this will be >0.

  if (!auto) {
    console.log(`Sacrificing ${rune} rune with ${budget} budget`)
  }
  if (!getRune(rune).isUnlocked) {
    return
  }

  let levelsToAdd = player.offeringbuyamount
  if (auto) {
    levelsToAdd = 20 * player.shopUpgrades.offeringAuto
  }
  if (auto && player.cubeUpgrades[20] > 0) {
    levelsToAdd *= 20
  }

  if (!auto) {
    console.log(`Sacrificing ${rune} rune with ${levelsToAdd} levels to add`)
  }

  getRune(rune).levelRune(levelsToAdd, budget, auto)

  player.offerings = Decimal.max(0, player.offerings)
}

export const buyBlessingLevels = (blessing: RuneBlessingKeys, budget: Decimal, auto = false) => {
  if (player.achievements[134] === 0) {
    return
  }

  const levelsToAdd = player.runeBlessingBuyAmount

  getRuneBlessing(blessing).levelRune(levelsToAdd, budget, auto)
}

export const buyAllBlessingLevels = (budget: Decimal, auto = false) => {
  const ratio = 5 // Change if there are more blessings later on
  for (const key of Object.keys(runeBlessingData) as RuneBlessingKeys[]) {
    buyBlessingLevels(key, budget.div(ratio), auto)
  }
}

export const buySpiritLevels = (spirit: RuneSpiritKeys, budget: Decimal, auto = false) => {
  if (player.challengecompletions[12] === 0) {
    return
  }

  const levelsToAdd = player.runeSpiritBuyAmount

  getRuneSpirit(spirit).levelRune(levelsToAdd, budget, auto)
}

export const buyAllSpiritLevels = (budget: Decimal, auto = false) => {
  const ratio = 5 // Change if there are more spirits later on
  for (const key of Object.keys(runeSpiritData) as RuneSpiritKeys[]) {
    buySpiritLevels(key, budget.div(ratio), auto)
  }
}
