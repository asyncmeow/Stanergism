import Decimal from 'break_infinity.js'
import i18next from 'i18next'
import { achievementManager, ungroupedNameMap } from './Achievements'
import { DOMCacheGetOrSet } from './Cache/DOM'
import { isShopTalismanUnlocked } from './Calculate'
import { CalcECC } from './Challenges'
import { PCoinUpgradeEffects } from './PseudoCoinUpgrades'
import { getRune, resetTiers, type RuneKeys } from './Runes'
import { allTalismanRuneBonusStats } from './Statistics'
import { format, formatAsPercentIncrease, player } from './Synergism'
import { Globals as G } from './Variables'
import { assert } from './Utility'
import { Tabs } from './Tabs'

interface TalismanFragmentCost {
  obtainium: number
  offerings: number
}

export type TalismanCraftItems =
  | 'shard'
  | 'commonFragment'
  | 'uncommonFragment'
  | 'rareFragment'
  | 'epicFragment'
  | 'legendaryFragment'
  | 'mythicalFragment'

const talismanResourceCosts: Record<TalismanCraftItems, TalismanFragmentCost> = {
  shard: {
    obtainium: 1e13,
    offerings: 1e2
  },
  commonFragment: {
    obtainium: 1e14,
    offerings: 1e4
  },
  uncommonFragment: {
    obtainium: 1e16,
    offerings: 1e5
  },
  rareFragment: {
    obtainium: 1e18,
    offerings: 1e6
  },
  epicFragment: {
    obtainium: 1e20,
    offerings: 1e7
  },
  legendaryFragment: {
    obtainium: 1e22,
    offerings: 1e8
  },
  mythicalFragment: {
    obtainium: 1e24,
    offerings: 1e9
  }
}

export type TalismanRuneBonus = Record<RuneKeys, number>

interface BaseReward {
  inscriptionDesc: () => string
  signatureDesc: () => string
}

interface ExemptionReward extends BaseReward {
  taxReduction: number
  duplicationOOMBonus: number
}

interface ChronosReward extends BaseReward {
  globalSpeed: number
  speedOOMBonus: number
}

interface MidasReward extends BaseReward {
  blessingBonus: number
  thriftOOMBonus: number
}

interface MetaphysicsReward extends BaseReward {
  talismanEffect: number
  extraTalismanEffect: number
}

interface PolymathReward extends BaseReward {
  ascensionSpeedBonus: number
  SIOOMBonus: number
}

interface MortuusReward extends BaseReward {
  antBonus: number
  prismOOMBonus: number
}

interface PlasticReward extends BaseReward {
  quarkBonus: number
}

interface WowSquareReward extends BaseReward {
  evenDimBonus: number
  oddDimBonus: number
}

interface GrandmaReward extends BaseReward {
  freeCorruptionLevel: number
  cookieSix: boolean
}

interface HorseShoeReward extends BaseReward {
  luckPercentage: number
  redLuck: number
}

type TalismanTypeMap = {
  exemption: ExemptionReward
  chronos: ChronosReward
  midas: MidasReward
  metaphysics: MetaphysicsReward
  polymath: PolymathReward
  mortuus: MortuusReward
  plastic: PlasticReward
  wowSquare: WowSquareReward
  cookieGrandma: GrandmaReward
  horseShoe: HorseShoeReward
}

export type TalismanKeys = keyof TalismanTypeMap

export const noTalismanFragments: Record<TalismanCraftItems, number> = {
  shard: 0,
  commonFragment: 0,
  uncommonFragment: 0,
  rareFragment: 0,
  epicFragment: 0,
  legendaryFragment: 0,
  mythicalFragment: 0
}

const rarityValues: Record<number, number> = {
  1: 1,
  2: 1.2,
  3: 1.5,
  4: 1.8,
  5: 2.1,
  6: 2.5,
  7: 3,
  8: 3.25,
  9: 3.5,
  10: 4
}

export const universalTalismanBonusMult = () => {
  return allTalismanRuneBonusStats.reduce((a, b) => a + b.stat(), 0)
}

interface TalismanData<K extends TalismanKeys> {
  // Fields supplied by data object
  baseMult: number
  maxLevel: number
  costs: (this: void, baseMult: number, level: number) => Record<TalismanCraftItems, number>
  levelCapIncrease: () => number
  rewards(n: number): TalismanTypeMap[K]
  isUnlocked: () => boolean
  minimalResetTier: keyof typeof resetTiers
  talismanBaseCoefficient: TalismanRuneBonus

  // Field that is stored in the player
  fragmentsInvested?: Record<TalismanCraftItems, number>
}

export class Talisman<K extends TalismanKeys> {
  readonly name: string
  readonly description: string

  readonly costs: (this: void, baseMult: number, level: number) => Record<TalismanCraftItems, number>
  readonly levelCapIncrease: () => number
  readonly baseMult: number
  readonly maxLevel: number
  readonly rewards: (n: number) => TalismanTypeMap[K]
  readonly _isUnlocked: () => boolean
  readonly minimalResetTier: keyof typeof resetTiers
  readonly talismanBaseCoefficient: TalismanRuneBonus

  public _level = 0
  #key: K

  public fragmentsInvested = noTalismanFragments

  constructor (data: TalismanData<K>, key: K) {
    this.name = i18next.t(`runes.talismans.${key}.name`)
    this.description = i18next.t(`runes.talismans.${key}.description`)
    this.#key = key

    this.costs = data.costs
    this.levelCapIncrease = data.levelCapIncrease
    this.baseMult = data.baseMult
    this.maxLevel = data.maxLevel
    this.rewards = data.rewards
    this._isUnlocked = data.isUnlocked
    this.talismanBaseCoefficient = data.talismanBaseCoefficient
    this.minimalResetTier = data.minimalResetTier

    this.fragmentsInvested = data.fragmentsInvested ?? noTalismanFragments
    this.updateLevelAndSpentFromInvested()
  }

  get costTNL () {
    return this.costs(this.baseMult, this.level)
  }

  get effectiveLevelCap () {
    return this.maxLevel + this.levelCapIncrease()
  }

  set level (level: number) {
    this._level = Math.min(level, this.effectiveLevelCap)
  }

  get level () {
    return this._level
  }

  // From 1 to 7 with linear scaling, unaffected by level cap increasers
  // Rarities 8-10 depend on overcap
  get rarity () {
    if (!this.isUnlocked) {
      return 0
    }

    let extraRarity = 0
    if (this.level >= this.maxLevel) {
      if (this.level / this.maxLevel >= 2) {
        extraRarity += 1
      }
      if (this.level / this.maxLevel >= 4) {
        extraRarity += 1
      }
      if (this.level / this.maxLevel >= 8) {
        extraRarity += 1
      }
    }

    return 1 + Math.min(6, Math.floor(6 * this.level / this.maxLevel)) + extraRarity
  }

  get levelsUntilRarityIncrease () {
    if (this.level >= this.maxLevel) {
      return this.effectiveLevelCap - this.level
    } else {
      const currentRarity = this.rarity
      const levelReq = Math.ceil(this.maxLevel * currentRarity / 6)
      return levelReq - this.level
    }
  }

  get isUnlocked () {
    return this._isUnlocked()
  }

  set fragments (fragments: Record<TalismanCraftItems, number>) {
    this.fragmentsInvested = { ...fragments }
    this.updateLevelAndSpentFromInvested()
  }

  affordableNextLevel (budget: Record<TalismanCraftItems, number>): boolean {
    const costs = this.costs(this.baseMult, this.level)

    for (const item in costs) {
      if (costs[item as TalismanCraftItems] > budget[item as TalismanCraftItems]) {
        return false
      }
    }
    return true
  }

  updateLevelAndSpentFromInvested (): void {
    let level = 0
    const budget = { ...this.fragmentsInvested }

    let nextCost = this.costs(this.baseMult, level)

    let canAffordNextLevel = this.affordableNextLevel(budget)
    while (canAffordNextLevel) {
      for (const item in nextCost) {
        budget[item as TalismanCraftItems] -= nextCost[item as TalismanCraftItems]
      }
      level += 1
      nextCost = this.costs(this.baseMult, level)

      if (level >= this.effectiveLevelCap) {
        break
      }

      canAffordNextLevel = this.affordableNextLevel(budget)
    }

    this.level = level
  }

  updateResourcePredefinedLevel (level: number): void {
    this.level = Math.min(level, this.effectiveLevelCap)
    this.fragmentsInvested = { ...noTalismanFragments }

    for (let n = 0; n < this.level; n++) {
      const nextCost = this.costs(this.baseMult, n)
      for (const item in nextCost) {
        this.fragmentsInvested[item as TalismanCraftItems] += nextCost[item as TalismanCraftItems]
      }
    }

    this.updatePlayerData()
  }

  constructBudget (): Record<TalismanCraftItems, number> {
    return {
      shard: player.talismanShards,
      commonFragment: player.commonFragments,
      uncommonFragment: player.uncommonFragments,
      rareFragment: player.rareFragments,
      epicFragment: player.epicFragments,
      legendaryFragment: player.legendaryFragments,
      mythicalFragment: player.mythicalFragments
    }
  }

  buyTalismanLevel (multiBuy = false): void {
    if (!this.isUnlocked) {
      return
    }

    const costs = this.costs(this.baseMult, this.level)
    const budget = this.constructBudget()
    const canAffordNextLevel = this.affordableNextLevel(budget)

    if (canAffordNextLevel) {
      player.talismanShards -= costs.shard
      player.commonFragments -= costs.commonFragment
      player.uncommonFragments -= costs.uncommonFragment
      player.rareFragments -= costs.rareFragment
      player.epicFragments -= costs.epicFragment
      player.legendaryFragments -= costs.legendaryFragment
      player.mythicalFragments -= costs.mythicalFragment

      for (const item in costs) {
        this.fragmentsInvested[item as TalismanCraftItems] += costs[item as TalismanCraftItems]
      }

      this.level += 1
    }

    if (!multiBuy) {
      this.updateCostHTML()
      this.updatePlayerData()
      updateTalismanInventory()
    }
  }

  buyLevelToRarityIncrease (auto = false): void {
    const levelsToBuy = this.levelsUntilRarityIncrease
    if (levelsToBuy > 0) {
      for (let i = 0; i < levelsToBuy; i++) {
        const budget = this.constructBudget()
        if (!this.affordableNextLevel(budget)) {
          break
        }
        this.buyTalismanLevel(true)
      }
    }

    if (!auto) {
      this.updateCostHTML()
    }
    this.updatePlayerData()
    updateTalismanInventory()
  }

  buyLevelToMax (): void {
    const levelsToBuy = this.effectiveLevelCap - this.level
    if (levelsToBuy > 0) {
      for (let i = 0; i < levelsToBuy; i++) {
        const budget = this.constructBudget()
        if (!this.affordableNextLevel(budget)) {
          break
        }
        this.buyTalismanLevel()
      }
    }

    this.updateCostHTML()
    this.updatePlayerData()
    updateTalismanInventory()
  }

  public get bonus () {
    return this.rewards(this.rarity)
  }

  public get inscriptionDesc (): string {
    return this.bonus.inscriptionDesc()
  }

  public get signatureDesc (): string {
    return this.bonus.signatureDesc()
  }

  public get runeBonuses (): TalismanRuneBonus {
    const rarityValue = rarityValues[this.rarity] ?? 1

    let specialMultiplier = universalTalismanBonusMult()

    if (this.#key === 'metaphysics') {
      specialMultiplier += (this.bonus as MetaphysicsReward).talismanEffect
      specialMultiplier *= (this.bonus as MetaphysicsReward).extraTalismanEffect
    }

    return {
      speed: this.talismanBaseCoefficient.speed * rarityValue * this.level * specialMultiplier,
      duplication: this.talismanBaseCoefficient.duplication * rarityValue * this.level * specialMultiplier,
      prism: this.talismanBaseCoefficient.prism * rarityValue * this.level * specialMultiplier,
      thrift: this.talismanBaseCoefficient.thrift * rarityValue * this.level * specialMultiplier,
      superiorIntellect: this.talismanBaseCoefficient.superiorIntellect * rarityValue * this.level * specialMultiplier,
      infiniteAscent: this.talismanBaseCoefficient.infiniteAscent * rarityValue * this.level * specialMultiplier,
      antiquities: this.talismanBaseCoefficient.antiquities * rarityValue * this.level * specialMultiplier,
      horseShoe: this.talismanBaseCoefficient.horseShoe * rarityValue * this.level * specialMultiplier
    }
  }

  updateRewardHTML () {
    assert(G.currentTab === Tabs.Runes, 'Talisman updateRewardHTML called outside of Runes tab')
    DOMCacheGetOrSet('talismanlevelup').style.display = 'none'
    DOMCacheGetOrSet('talismanEffect').style.display = 'block'

    DOMCacheGetOrSet('talismanTitle').innerHTML = `${this.name} - ${i18next.t(`runes.talismans.rarity.${this.rarity}`)}`
    DOMCacheGetOrSet('talismanDescription').innerHTML = this.description

    const speedHTML = DOMCacheGetOrSet('talismanSpeedEffect')
    const duplicationHTML = DOMCacheGetOrSet('talismanDupeEffect')
    const prismHTML = DOMCacheGetOrSet('talismanPrismEffect')
    const thriftHTML = DOMCacheGetOrSet('talismanThriftEffect')
    const sIHTML = DOMCacheGetOrSet('talismanSIEffect')
    const iAHTML = DOMCacheGetOrSet('talismanIAEffect')
    const antiquitiesHTML = DOMCacheGetOrSet('talismanAntiquitiesEffect')

    const inscriptionHTML = DOMCacheGetOrSet('talismanInscriptionBonus')
    const signatureHTML = DOMCacheGetOrSet('talismanSignatureBonus')

    const noResetHTML = DOMCacheGetOrSet('talismanNoResetText')

    inscriptionHTML.innerHTML = this.inscriptionDesc

    this.rarity >= 6
      ? (() => {
        signatureHTML.style.display = 'block'
        signatureHTML.innerHTML = this.signatureDesc
      })()
      : (() => {
        signatureHTML.style.display = 'none'
      })()

    this.runeBonuses.speed > 0 && getRune('speed').isUnlocked
      ? (() => {
        speedHTML.style.display = 'block'
        speedHTML.innerHTML = i18next.t('runes.talismans.bonusRuneLevels.speed', {
          x: format(this.runeBonuses.speed, 0, true)
        })
      })()
      : (() => {
        DOMCacheGetOrSet('talismanSpeedEffect').style.display = 'none'
      })()
    this.runeBonuses.duplication > 0 && getRune('duplication').isUnlocked
      ? (() => {
        duplicationHTML.style.display = 'block'
        duplicationHTML.innerHTML = i18next.t('runes.talismans.bonusRuneLevels.duplication', {
          x: format(this.runeBonuses.duplication, 0, true)
        })
      })()
      : (() => {
        DOMCacheGetOrSet('talismanDupeEffect').style.display = 'none'
      })()
    this.runeBonuses.prism > 0 && getRune('prism').isUnlocked
      ? (() => {
        prismHTML.style.display = 'block'
        prismHTML.innerHTML = i18next.t('runes.talismans.bonusRuneLevels.prism', {
          x: format(this.runeBonuses.prism, 0, true)
        })
      })()
      : (() => {
        DOMCacheGetOrSet('talismanPrismEffect').style.display = 'none'
      })()
    this.runeBonuses.thrift > 0 && getRune('thrift').isUnlocked
      ? (() => {
        thriftHTML.style.display = 'block'
        thriftHTML.innerHTML = i18next.t('runes.talismans.bonusRuneLevels.thrift', {
          x: format(this.runeBonuses.thrift, 0, true)
        })
      })()
      : (() => {
        DOMCacheGetOrSet('talismanThriftEffect').style.display = 'none'
      })()
    this.runeBonuses.superiorIntellect > 0 && getRune('superiorIntellect').isUnlocked
      ? (() => {
        sIHTML.style.display = 'block'
        sIHTML.innerHTML = i18next.t('runes.talismans.bonusRuneLevels.SI', {
          x: format(this.runeBonuses.superiorIntellect, 0, true)
        })
      })()
      : (() => {
        DOMCacheGetOrSet('talismanSIEffect').style.display = 'none'
      })()
    this.runeBonuses.infiniteAscent > 0 && getRune('infiniteAscent').isUnlocked
      ? (() => {
        iAHTML.style.display = 'block'
        iAHTML.innerHTML = i18next.t('runes.talismans.bonusRuneLevels.IA', {
          x: format(this.runeBonuses.infiniteAscent, 2, true)
        })
      })()
      : (() => {
        DOMCacheGetOrSet('talismanIAEffect').style.display = 'none'
      })()
    this.runeBonuses.antiquities > 0 && getRune('antiquities').isUnlocked
      ? (() => {
        antiquitiesHTML.style.display = 'block'
        antiquitiesHTML.innerHTML = i18next.t('runes.talismans.bonusRuneLevels.antiquities', {
          x: format(this.runeBonuses.antiquities, 2, true)
        })
      })()
      : (() => {
        antiquitiesHTML.style.display = 'none'
      })()

    resetTiers[this.minimalResetTier] > resetTiers.singularity
      ? (() => {
        noResetHTML.style.display = 'block'
        noResetHTML.innerHTML = i18next.t('runes.talismans.doesNotReset')
      })()
      : (() => {
        noResetHTML.style.display = 'none'
      })()
  }

  updateCostHTML () {
    assert(G.currentTab === Tabs.Runes, 'Talisman updateCostHTML called outside of Runes tab')
    DOMCacheGetOrSet('talismanEffect').style.display = 'none'
    DOMCacheGetOrSet('talismanlevelup').style.display = 'block'
    const a = DOMCacheGetOrSet('talismanShardCost')
    const b = DOMCacheGetOrSet('talismanCommonFragmentCost')
    const c = DOMCacheGetOrSet('talismanUncommonFragmentCost')
    const d = DOMCacheGetOrSet('talismanRareFragmentCost')
    const e = DOMCacheGetOrSet('talismanEpicFragmentCost')
    const f = DOMCacheGetOrSet('talismanLegendaryFragmentCost')
    const g = DOMCacheGetOrSet('talismanMythicalFragmentCost')

    DOMCacheGetOrSet('talismanLevelUpSummary').textContent = i18next.t('runes.resourcesToLevelup')
    DOMCacheGetOrSet('talismanLevelUpSummary').style.color = 'silver'

    const nextCost = this.costTNL
    a.textContent = format(nextCost.shard, 0, false)
    b.textContent = format(nextCost.commonFragment, 0, false)
    c.textContent = format(nextCost.uncommonFragment, 0, false)
    d.textContent = format(nextCost.rareFragment, 0, false)
    e.textContent = format(nextCost.epicFragment, 0, false)
    f.textContent = format(nextCost.legendaryFragment, 0, false)
    g.textContent = format(nextCost.mythicalFragment, 0, false)
  }

  updateTalismanDisplay () {
    assert(G.currentTab === Tabs.Runes, 'Talisman updateTalismanDisplay called outside of Runes tab')
    const el = DOMCacheGetOrSet(`${this.#key}TalismanIconWrapper`)
    const la = DOMCacheGetOrSet(`${this.#key}TalismanLevel`)
    const ti = DOMCacheGetOrSet(`${this.#key}Talisman`)

    el.classList.remove('rainbowBorder')
    el.classList.add('talismanIcon')
    la.classList.remove('rainbowText')

    la.textContent = `${format(this.level)}/${format(this.effectiveLevelCap)}`
    const rarity = this.rarity
    if (rarity === 1) {
      ti.style.border = '3px solid white'
      la.style.color = 'white'
    }
    if (rarity === 2) {
      ti.style.border = '3px solid limegreen'
      la.style.color = 'limegreen'
    }
    if (rarity === 3) {
      ti.style.border = '3px solid lightblue'
      la.style.color = 'lightblue'
    }
    if (rarity === 4) {
      ti.style.border = '3px solid plum'
      la.style.color = 'plum'
    }
    if (rarity === 5) {
      ti.style.border = '3px solid orange'
      la.style.color = 'orange'
    }
    if (rarity === 6) {
      ti.style.border = '3px solid crimson'
      la.style.color = 'var(--crimson-text-color)'
    }
    if (rarity === 7) {
      ti.style.border = '3px solid cyan'
      la.style.color = 'cyan'
    }
    if (rarity === 8) {
      ti.style.border = '3px solid red'
      la.style.color = 'red'
    }
    if (rarity === 9) {
      ti.style.border = '3px solid gold'
      la.style.color = 'gold'
    }
    if (rarity === 10) {
      ti.style.border = ''
      el.classList.remove('talismanIcon')
      el.classList.add('rainbowBorder')
      la.style.color = ''
      la.classList.add('talismanLevel')
      la.classList.add('rainbowText')
    }
  }

  resetTalisman () {
    this.level = 0
    this.fragmentsInvested = { ...noTalismanFragments }
    this.updatePlayerData()
  }

  // We need only store this! Wow!
  updatePlayerData () {
    player.talismans[this.#key] = { ...this.fragmentsInvested }
  }
}

const regularCostProgression = (baseMult: number, level: number): Record<TalismanCraftItems, number> => {
  let priceMult = baseMult
  if (level >= 120) {
    priceMult *= (level - 90) / 30
  }
  if (level >= 150) {
    priceMult *= (level - 120) / 30
  }
  if (level >= 180) {
    priceMult *= (level - 170) / 10
  }

  return {
    'shard': priceMult * Math.max(0, Math.floor(1 + 1 / 8 * Math.pow(level, 3))),
    'commonFragment': level >= 30 ? priceMult * Math.max(0, Math.floor(1 + 1 / 32 * Math.pow(level - 30, 3))) : 0,
    'uncommonFragment': level >= 60 ? priceMult * Math.max(0, Math.floor(1 + 1 / 384 * Math.pow(level - 60, 3))) : 0,
    'rareFragment': level >= 90 ? priceMult * Math.max(0, Math.floor(1 + 1 / 500 * Math.pow(level - 90, 3))) : 0,
    'epicFragment': level >= 120 ? priceMult * Math.max(0, Math.floor(1 + 1 / 375 * Math.pow(level - 120, 3))) : 0,
    'legendaryFragment': level >= 150 ? priceMult * Math.max(0, Math.floor(1 + 1 / 192 * Math.pow(level - 150, 3))) : 0,
    'mythicalFragment': level >= 150 ? priceMult * Math.max(0, Math.floor(1 + 1 / 1280 * Math.pow(level - 150, 3))) : 0
  }
}

const exponentialCostProgression = (baseMult: number, level: number): Record<TalismanCraftItems, number> => {
  return {
    shard: Math.floor(baseMult * Math.pow(1.12, level) * 100),
    commonFragment: level >= 30 ? Math.floor(baseMult * Math.pow(1.12, level - 30) * 50) : 0,
    uncommonFragment: level >= 60 ? Math.floor(baseMult * Math.pow(1.12, level - 60) * 25) : 0,
    rareFragment: level >= 90 ? Math.floor(baseMult * Math.pow(1.12, level - 90) * 20) : 0,
    epicFragment: level >= 120 ? Math.floor(baseMult * Math.pow(1.12, level - 120) * 15) : 0,
    legendaryFragment: level >= 150 ? Math.floor(baseMult * Math.pow(1.12, level - 150) * 10) : 0,
    mythicalFragment: level >= 150 ? Math.floor(baseMult * Math.pow(1.12, level - 150) * 5) : 0
  }
}

export const universalTalismanMaxLevelIncreasers = () => {
  return (
    6 * CalcECC('ascension', player.challengecompletions[13])
    + Math.floor(player.researches[200] / 400)
    + +player.singularityChallenges.noOfferingPower.rewards.talismanFreeLevel
    + +player.octeractUpgrades.octeractTalismanLevelCap1.getEffect().bonus
    + +player.octeractUpgrades.octeractTalismanLevelCap2.getEffect().bonus
    + +player.octeractUpgrades.octeractTalismanLevelCap3.getEffect().bonus
    + +player.octeractUpgrades.octeractTalismanLevelCap4.getEffect().bonus
  )
}

export const metaphysicsTalismanMaxLevelIncreasers = () => {
  return player.cubeUpgrades[67] > 0 ? 1337 : 0
}

export const plasticTalismanMaxLevelIncreasers = () => {
  return PCoinUpgradeEffects.INSTANT_UNLOCK_1 ? 10 : 0
}

const talismanData: { [K in TalismanKeys]: TalismanData<K> } = {
  exemption: {
    baseMult: 1,
    maxLevel: 180,
    costs: regularCostProgression,
    levelCapIncrease: () => universalTalismanMaxLevelIncreasers(),
    rewards: (n) => {
      // Corresponding to rarity, here
      const inscriptValues = [0, -0.2, -0.3, -0.4, -0.45, -0.5, -0.55, -0.6, -0.61, -0.62, -0.65]
      const duplicationBonus = (n >= 6) ? 12 : 0
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.exemption.inscription', {
            val: format(1 + (inscriptValues[n] ?? 1), 2, true)
          }),
        signatureDesc: () =>
          i18next.t('runes.talismans.exemption.signature', {
            val: format(duplicationBonus, 0, true)
          }),
        taxReduction: inscriptValues[n] ?? 0,
        duplicationOOMBonus: duplicationBonus
      }
    },
    talismanBaseCoefficient: {
      speed: 0,
      duplication: 1.5,
      prism: 0.75,
      thrift: 0.75,
      superiorIntellect: 0,
      infiniteAscent: 0,
      antiquities: 0,
      horseShoe: 0
    },
    minimalResetTier: 'ascension',
    isUnlocked: () => {
      return Boolean(achievementManager.getBonus('exemptionTalisman'))
    }
  },
  chronos: {
    baseMult: 4,
    maxLevel: 180,
    costs: regularCostProgression,
    levelCapIncrease: () => universalTalismanMaxLevelIncreasers(),
    rewards: (n) => {
      const inscriptValues = [1, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.30, 1.325, 1.35, 1.4]
      const speedBonus = (n >= 6) ? 12 : 0
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.chronos.inscription', {
            val: formatAsPercentIncrease(inscriptValues[n] ?? 1, 0)
          }),
        signatureDesc: () =>
          i18next.t('runes.talismans.chronos.signature', {
            val: format(speedBonus, 0, true)
          }),
        globalSpeed: inscriptValues[n] ?? 1,
        speedOOMBonus: speedBonus
      }
    },
    talismanBaseCoefficient: {
      speed: 1.5,
      duplication: 0,
      prism: 0,
      thrift: 0.75,
      superiorIntellect: 0.75,
      infiniteAscent: 0,
      antiquities: 0,
      horseShoe: 0
    },
    minimalResetTier: 'ascension',
    isUnlocked: () => {
      return Boolean(achievementManager.getBonus('chronosTalisman'))
    }
  },
  midas: {
    baseMult: 1e4,
    maxLevel: 180,
    costs: regularCostProgression,
    levelCapIncrease: () => universalTalismanMaxLevelIncreasers(),
    rewards: (n) => {
      const inscriptValues = [1, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.30, 1.325, 1.35, 1.40]
      const thriftBonus = (n >= 6) ? 12 : 0
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.midas.inscription', {
            val: formatAsPercentIncrease(inscriptValues[n] ?? 1, 0)
          }),
        signatureDesc: () =>
          i18next.t('runes.talismans.midas.signature', {
            val: format(thriftBonus, 0, true)
          }),
        blessingBonus: inscriptValues[n] ?? 1,
        thriftOOMBonus: thriftBonus
      }
    },
    talismanBaseCoefficient: {
      speed: 0,
      duplication: 0.75,
      prism: 0.75,
      thrift: 1.5,
      superiorIntellect: 0,
      infiniteAscent: 0,
      antiquities: 0,
      horseShoe: 0
    },
    minimalResetTier: 'ascension',
    isUnlocked: () => {
      return Boolean(achievementManager.getBonus('midasTalisman'))
    }
  },
  metaphysics: {
    baseMult: 1e8,
    maxLevel: 180,
    costs: regularCostProgression,
    levelCapIncrease: () => {
      return universalTalismanMaxLevelIncreasers() + metaphysicsTalismanMaxLevelIncreasers()
    },
    rewards: (n) => {
      const inscriptValues = [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5]
      const signatureValue = (n >= 6) ? 1.07 : 1
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.metaphysics.inscription', {
            val: formatAsPercentIncrease(1 + (inscriptValues[n] ?? 0), 0)
          }),
        signatureDesc: () =>
          i18next.t('runes.talismans.metaphysics.signature', {
            val: formatAsPercentIncrease(signatureValue, 2)
          }),
        talismanEffect: inscriptValues[n] ?? 0,
        extraTalismanEffect: signatureValue
      }
    },
    talismanBaseCoefficient: {
      speed: 0.6,
      duplication: 0.6,
      prism: 0.6,
      thrift: 0.6,
      superiorIntellect: 0.6,
      infiniteAscent: 0,
      antiquities: 0,
      horseShoe: 0
    },
    minimalResetTier: 'ascension',
    isUnlocked: () => {
      return Boolean(achievementManager.getBonus('metaphysicsTalisman'))
    }
  },
  polymath: {
    baseMult: 1e13,
    maxLevel: 180,
    costs: regularCostProgression,
    levelCapIncrease: () => universalTalismanMaxLevelIncreasers(),
    rewards: (n) => {
      const inscriptValues = [1, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.30, 1.325, 1.35, 1.40]
      const SIOOMBonus = (n >= 6) ? 12 : 0
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.polymath.inscription', {
            val: formatAsPercentIncrease(inscriptValues[n] ?? 1, 0)
          }),
        signatureDesc: () =>
          i18next.t('runes.talismans.polymath.signature', {
            val: format(SIOOMBonus, 0, true)
          }),
        ascensionSpeedBonus: inscriptValues[n] ?? 1,
        SIOOMBonus: SIOOMBonus
      }
    },
    talismanBaseCoefficient: {
      speed: 0.75,
      duplication: 0.75,
      prism: 0,
      thrift: 0,
      superiorIntellect: 1.5,
      infiniteAscent: 0,
      antiquities: 0,
      horseShoe: 0
    },
    minimalResetTier: 'ascension',
    isUnlocked: () => {
      return Boolean(achievementManager.getBonus('polymathTalisman'))
    }
  },
  mortuus: {
    baseMult: 10,
    maxLevel: 180,
    costs: regularCostProgression,
    levelCapIncrease: () => universalTalismanMaxLevelIncreasers(),
    rewards: (n) => {
      const inscriptValues = [1, 1.02, 1.04, 1.06, 1.07, 1.08, 1.09, 1.10, 1.11, 1.125, 1.15]
      const prismOOMBonus = (n >= 6) ? 12 : 0
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.mortuus.inscription', {
            val: formatAsPercentIncrease(inscriptValues[n] ?? 1, 0)
          }),
        signatureDesc: () =>
          i18next.t('runes.talismans.mortuus.signature', {
            val: format(prismOOMBonus, 0, true)
          }),
        antBonus: inscriptValues[n] ?? 1,
        prismOOMBonus: prismOOMBonus
      }
    },
    talismanBaseCoefficient: {
      speed: 0.6,
      duplication: 0.6,
      prism: 0.6,
      thrift: 0.6,
      superiorIntellect: 0.6,
      infiniteAscent: 0,
      antiquities: 0,
      horseShoe: 0
    },
    minimalResetTier: 'ascension',
    isUnlocked: () => {
      return player.antUpgrades[11]! > 0 || player.ascensionCount > 0
    }
  },
  plastic: {
    baseMult: 100,
    maxLevel: 180,
    costs: regularCostProgression,
    levelCapIncrease: () => {
      return universalTalismanMaxLevelIncreasers() + plasticTalismanMaxLevelIncreasers()
    },
    rewards: (n) => {
      const inscriptValues = [1, 1.005, 1.01, 1.015, 1.02, 1.025, 1.03, 1.04, 1.045, 1.05, 1.0666]
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.plastic.inscription', {
            val: formatAsPercentIncrease(inscriptValues[n] ?? 1, 2)
          }),
        signatureDesc: () => i18next.t('runes.talismans.plastic.signature'),
        quarkBonus: inscriptValues[n] ?? 1
      }
    },
    talismanBaseCoefficient: {
      speed: 0.75,
      duplication: 0,
      prism: 1.5,
      thrift: 0,
      superiorIntellect: 0.75,
      infiniteAscent: 0.005,
      antiquities: 0,
      horseShoe: 0
    },
    minimalResetTier: 'ascension',
    isUnlocked: () => {
      return isShopTalismanUnlocked()
    }
  },
  wowSquare: {
    maxLevel: 210,
    baseMult: 1e20,
    costs: exponentialCostProgression,
    levelCapIncrease: () => universalTalismanMaxLevelIncreasers(),
    rewards: (n) => {
      const inscriptValues = [1, 1.025, 1.05, 1.075, 1.1, 1.125, 1.15, 1.2, 1.225, 1.25, 1.30]
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.wowSquare.inscription', {
            val: formatAsPercentIncrease(inscriptValues[n] ?? 1, 0)
          }),
        signatureDesc: () => i18next.t('runes.talismans.wowSquare.signature'),
        evenDimBonus: inscriptValues[n] ?? 1,
        oddDimBonus: n >= 6 ? 1.20 : 1
      }
    },
    talismanBaseCoefficient: {
      speed: 0,
      duplication: 1,
      prism: 1,
      thrift: 0,
      superiorIntellect: 1,
      infiniteAscent: 0,
      antiquities: 0,
      horseShoe: 0
    },
    minimalResetTier: 'ascension',
    isUnlocked: () => {
      return player.ascensionCount >= 100
    }
  },
  cookieGrandma: {
    baseMult: 1e290,
    maxLevel: 60,
    costs: exponentialCostProgression,
    levelCapIncrease: () => 0,
    rewards: (n) => {
      const inscriptValues = [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.15, 0.15, 0.16, 0.175]
      const cookiesSix = n >= 6
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.cookieGrandma.inscription', {
            val: format(inscriptValues[n] ?? 0, 3)
          }),
        signatureDesc: () => i18next.t('runes.talismans.cookieGrandma.signature'),
        freeCorruptionLevel: inscriptValues[n] ?? 0,
        cookieSix: cookiesSix
      }
    },
    talismanBaseCoefficient: {
      speed: 1,
      duplication: 1,
      prism: 1,
      thrift: 1,
      superiorIntellect: 1,
      infiniteAscent: 0.01,
      antiquities: 0.01,
      horseShoe: 0
    },
    minimalResetTier: 'never',
    isUnlocked: () => {
      return player.cubeUpgrades[80] > 0
    }
  },
  horseShoe: {
    baseMult: 1e290,
    maxLevel: 100,
    costs: exponentialCostProgression,
    levelCapIncrease: () => 0,
    rewards: (n) => {
      const inscriptValues = [0, 0.005, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.055, 0.06, 0.777]
      const signatureValue = (n >= 6) ? 40 : 0
      return {
        inscriptionDesc: () =>
          i18next.t('runes.talismans.horseShoe.inscription', {
            val: format(100 * (inscriptValues[n] ?? 0), 2)
          }),
        signatureDesc: () =>
          i18next.t('runes.talismans.horseShoe.signature', {
            val: signatureValue
          }),
        luckPercentage: inscriptValues[n] ?? 0,
        redLuck: signatureValue
      }
    },
    talismanBaseCoefficient: {
      speed: 1.2,
      duplication: 1.2,
      prism: 1.2,
      thrift: 1.2,
      superiorIntellect: 1.2,
      infiniteAscent: 0,
      antiquities: 0,
      horseShoe: 0.01
    },
    minimalResetTier: 'never',
    isUnlocked: () => {
      return Boolean(player.singularityChallenges.noOfferingPower.rewards.talismanUnlock)
    }
  }
}

// Create an object that is NOT on the player, but can be used (once initialized).
export type TalismansMap = {
  [K in TalismanKeys]: Talisman<K>
}
let talismans: TalismansMap

export function initTalismans (investments: Record<TalismanKeys, Record<TalismanCraftItems, number>>) {
  if (talismans !== undefined) {
    for (const talisman of Object.keys(talismans) as TalismanKeys[]) {
      talismans[talisman].fragments = { ...investments[talisman] }
    }
  } else {
    const upgrades = {} as TalismansMap
    const keys = Object.keys(talismanData) as TalismanKeys[]

    // Use type assertions after careful validation
    for (const key of keys) {
      const data = talismanData[key]
      const invested = investments[key]

      const dataWithInvestment = {
        ...data,
        fragmentsInvested: invested
      }

      // Use a function that casts the result appropriately
      const talisman = new Talisman(dataWithInvestment, key) // Here we need to use type assertion because TypeScript can't track
      ;(upgrades as Record<TalismanKeys, Talisman<TalismanKeys>>)[key] = talisman
      // the relationship between the key and the generic parameter in the loo
    }

    talismans = upgrades as TalismansMap
  }
}

export function getTalisman<K extends TalismanKeys> (key: K): Talisman<K> {
  if (talismans === null) {
    throw new Error('Talisman not initialized. Call initTalismans first.')
  }
  return talismans[key]
}

export const getTalismanBonus = (rune: RuneKeys) => {
  let totalBonus = 0
  if (talismans === null) {
    return 0
  } else {
    for (const talisman of Object.values(talismans)) {
      totalBonus += talisman.runeBonuses[rune]
    }
  }
  return totalBonus
}

export const resetTalismans = (tier: keyof typeof resetTiers) => {
  if (talismans === null) {
    throw new Error('Talisman not initialized. Call initTalismans first.')
  } else {
    for (const talisman of Object.values(talismans)) {
      if (resetTiers[tier] >= resetTiers[talisman.minimalResetTier]) {
        talisman.resetTalisman()
      }
    }
  }

  player.talismanShards = 0
  player.commonFragments = 0
  player.uncommonFragments = 0
  player.rareFragments = 0
  player.epicFragments = 0
  player.legendaryFragments = 0
  player.mythicalFragments = 0
}

export const sumOfTalismanRarities = () => {
  if (talismans === null) {
    throw new Error('Talisman not initialized. Call initTalismans first.')
  } else {
    let sum = 0
    for (const talisman of Object.values(talismans)) {
      sum += talisman.rarity
    }
    return sum
  }
}

export const updateAllTalismanHTML = () => {
  if (talismans === null) {
    throw new Error('Talisman not initialized. Call initTalismans first.')
  } else {
    for (const talisman of Object.values(talismans)) {
      talisman.updateTalismanDisplay()
    }
  }
}

export const generateTalismansHTML = () => {
  const alreadyGenerated = document.getElementsByClassName('talismanContainer').length > 0

  if (alreadyGenerated) {
    return
  } else {
    const talismansContainer = DOMCacheGetOrSet('talismansContainerDiv')

    for (const key of Object.keys(talismanData) as TalismanKeys[]) {
      const talismansDiv = document.createElement('div')
      talismansDiv.className = 'talismanContainer'
      talismansDiv.id = `${key}TalismanContainer`

      const talismansName = document.createElement('span')
      talismansName.className = 'talismanName'
      talismansName.setAttribute('i18n', `runes.talismans.names.${key}`)

      talismansDiv.appendChild(talismansName)

      const talismanIconDivWrapper = document.createElement('div')
      talismanIconDivWrapper.id = `${key}TalismanIconWrapper`
      talismanIconDivWrapper.className = 'talismanIcon'

      const talismansIcon = document.createElement('img')
      talismansIcon.id = `${key}Talisman`
      talismansIcon.alt = `${key} Talisman`
      talismansIcon.src = `Pictures/Talismans/${key.charAt(0).toUpperCase() + key.slice(1)}.png`
      talismansIcon.loading = 'lazy'

      talismanIconDivWrapper.appendChild(talismansIcon)

      talismansDiv.appendChild(talismanIconDivWrapper)

      const talismansLevel = document.createElement('span')
      talismansLevel.className = 'talismanLevel'
      talismansLevel.id = `${key}TalismanLevel`
      talismansLevel.textContent = 'Level 0/30'

      talismansDiv.appendChild(talismansLevel)

      const talismansLevelUpButton = document.createElement('button')
      talismansLevelUpButton.className = 'talismanBtn'
      talismansLevelUpButton.id = `level${key}Once`
      talismansLevelUpButton.style.color = 'silver'
      talismansLevelUpButton.style.border = '2px solid white'
      talismansLevelUpButton.setAttribute('i18n', 'runes.talismans.fortify')
      talismansLevelUpButton.textContent = i18next.t('runes.talismans.fortify')

      talismansDiv.appendChild(talismansLevelUpButton)

      const talismansLevelUpButton2 = document.createElement('button')
      talismansLevelUpButton2.className = 'talismanBtn'
      talismansLevelUpButton2.id = `level${key}ToRarityIncrease`
      talismansLevelUpButton2.style.color = 'gold'
      talismansLevelUpButton2.style.border = '2px solid orangered'
      talismansLevelUpButton2.setAttribute('i18n', 'runes.talismans.enhance')
      talismansLevelUpButton2.textContent = i18next.t('runes.talismans.enhance')

      talismansDiv.appendChild(talismansLevelUpButton2)

      const talismansLevelUpButton3 = document.createElement('button')
      talismansLevelUpButton3.className = 'talismanBtn'
      talismansLevelUpButton3.id = `level${key}ToMax`
      talismansLevelUpButton3.style.color = 'plum'
      talismansLevelUpButton3.style.border = '2px solid white'
      talismansLevelUpButton3.setAttribute('i18n', 'runes.talismans.respec')
      talismansLevelUpButton3.textContent = i18next.t('runes.talismans.respec')

      talismansDiv.appendChild(talismansLevelUpButton3)

      talismansContainer.appendChild(talismansDiv)
    }
  }
}

const getTalismanResourceInfo = (
  type: keyof typeof talismanResourceCosts,
  percentage = player.buyTalismanShardPercent
) => {
  const resourceCap = 1e270

  const obtainiumCost = talismanResourceCosts[type].obtainium
  const offeringCost = talismanResourceCosts[type].offerings

  const maxBuyObtainium = Math.max(
    1,
    Math.floor(Decimal.min(player.obtainium.div(obtainiumCost), resourceCap).toNumber())
  )
  const maxBuyOffering = Math.max(
    1,
    Math.floor(Decimal.min(player.offerings.div(offeringCost), resourceCap).toNumber())
  )
  const amountToBuy = Math.max(1, Math.floor(percentage / 100 * Math.min(maxBuyObtainium, maxBuyOffering)))
  const canBuy = player.obtainium.gte(obtainiumCost) && player.offerings.gte(offeringCost)
  return {
    canBuy, // Boolean, if false will not buy any fragments
    buyAmount: amountToBuy, // Integer, will buy as specified above.
    obtainiumCost: obtainiumCost * amountToBuy, // Integer, cost in obtainium to buy (buyAmount) resource
    offeringCost: offeringCost * amountToBuy // Integer, cost in offerings to buy (buyAmount) resource
  }
}

export const updateTalismanCostDisplay = (
  type: keyof typeof talismanResourceCosts | null,
  percentage = player.buyTalismanShardPercent
) => {
  const el = DOMCacheGetOrSet('talismanFragmentCost')
  if (type) {
    const talismanCostInfo = getTalismanResourceInfo(type, percentage)
    const talismanShardName = i18next.t(`runes.talismans.shards.${type}`)

    el.textContent = i18next.t('runes.talismans.costToBuy', {
      name: talismanShardName,
      buyAmount: format(talismanCostInfo.buyAmount),
      obtainium: format(talismanCostInfo.obtainiumCost),
      offerings: format(talismanCostInfo.offeringCost)
    })
  } else {
    // Buy All
    el.textContent = i18next.t('runes.talismans.clickBuyEveryType')
  }
}

export const toggleTalismanBuy = (i = player.buyTalismanShardPercent) => {
  DOMCacheGetOrSet('talismanTen').style.backgroundColor = ''
  DOMCacheGetOrSet('talismanTwentyFive').style.backgroundColor = ''
  DOMCacheGetOrSet('talismanFifty').style.backgroundColor = ''
  DOMCacheGetOrSet('talismanHundred').style.backgroundColor = ''
  player.buyTalismanShardPercent = i
  let x = 'Ten'
  if (i === 25) {
    x = 'TwentyFive'
  }
  if (i === 50) {
    x = 'Fifty'
  }
  if (i === 100) {
    x = 'Hundred'
  }

  DOMCacheGetOrSet(`talisman${x}`).style.backgroundColor = 'green'
}

export const updateTalismanInventory = () => {
  DOMCacheGetOrSet('talismanShardInventory').textContent = format(player.talismanShards)
  DOMCacheGetOrSet('commonFragmentInventory').textContent = format(player.commonFragments)
  DOMCacheGetOrSet('uncommonFragmentInventory').textContent = format(player.uncommonFragments)
  DOMCacheGetOrSet('rareFragmentInventory').textContent = format(player.rareFragments)
  DOMCacheGetOrSet('epicFragmentInventory').textContent = format(player.epicFragments)
  DOMCacheGetOrSet('legendaryFragmentInventory').textContent = format(player.legendaryFragments)
  DOMCacheGetOrSet('mythicalFragmentInventory').textContent = format(player.mythicalFragments)
}

export const buyAllTalismanResources = () => {
  const talismanItemNames = [
    'shard',
    'commonFragment',
    'uncommonFragment',
    'rareFragment',
    'epicFragment',
    'legendaryFragment',
    'mythicalFragment'
  ] as const
  for (let index = talismanItemNames.length - 1; index >= 0; index--) {
    buyTalismanResources(talismanItemNames[index])
  }
}

export const buyTalismanResources = (
  type: keyof typeof talismanResourceCosts,
  percentage = player.buyTalismanShardPercent
) => {
  const talismanResourcesData = getTalismanResourceInfo(type, percentage)

  if (talismanResourcesData.canBuy) {
    if (type === 'shard') {
      player.talismanShards += talismanResourcesData.buyAmount
    } else {
      player[`${type}s` as const] += talismanResourcesData.buyAmount
    }
    if (type === 'mythicalFragment' && player.mythicalFragments >= 1e25) {
      achievementManager.tryUnlock(ungroupedNameMap.seeingRed)
    }

    player.obtainium = player.obtainium.sub(talismanResourcesData.obtainiumCost)
    player.offerings = player.offerings.sub(talismanResourcesData.offeringCost)

    // When dealing with high values, calculations can be very slightly off due to floating point precision
    // and result in buying slightly (usually 1) more than the player can actually afford.
    // This results in negative obtainium or offerings with further calcs somehow resulting in NaN/undefined.
    // Instead of trying to work around floating point limits, just make sure nothing breaks as a result.
    // The calculation being done overall is similar to the following calculation:
    // 2.9992198253874083e47 - (Math.floor(2.9992198253874083e47 / 1e20) * 1e20)
    // which, for most values, returns 0, but values like this example will return a negative number instead.
    if (player.obtainium.lt(0)) {
      player.obtainium = new Decimal(0)
    }
    if (player.offerings.lt(0)) {
      player.offerings = new Decimal(0)
    }
  }
  updateTalismanCostDisplay(type, percentage)
  updateTalismanInventory()
}
