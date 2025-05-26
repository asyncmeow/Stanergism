import Decimal from 'break_infinity.js'
import type { StringMap } from 'i18next'
import i18next from 'i18next'
import { DOMCacheGetOrSet } from './Cache/DOM'
import {
  calculateCubeMultFromPowder,
  calculateCubeQuarkMultiplier,
  calculatePowderConversion,
  calculateQuarkMultFromPowder,
  forcedDailyReset
} from './Calculate'
import { Cube } from './CubeExperimental'
import { calculateSingularityDebuff } from './singularity'
import { format, player } from './Synergism'
import type { Player } from './types/Synergism'
import { Alert, Confirm, Prompt } from './UpdateHTML'
import { isDecimal } from './Utility'
import { Globals } from './Variables'

export interface HepteractValues {
  BAL: number
  TIMES_CAP_EXTENDED: number
  AUTO: boolean
}

export interface IHepteractCraft extends Partial<HepteractValues> {
  BASE_CAP: number
  HEPTERACT_CONVERSION: number
  OTHER_CONVERSIONS: Record<string, number>
  UNLOCKED: () => boolean
  RESET_ON_SINGULARITY: boolean
}

export const defaultHepteractValues: HepteractValues = {
  BAL: 0,
  TIMES_CAP_EXTENDED: 0,
  AUTO: false
}

export type HepteractNames =
  | 'chronos'
  | 'hyperrealism'
  | 'quark'
  | 'challenge'
  | 'abyss'
  | 'accelerator'
  | 'acceleratorBoost'
  | 'multiplier'
/*
export const hepteractTypeList = [
  'chronos',
  'hyperrealism',
  'quark',
  'challenge',
  'abyss',
  'accelerator',
  'acceleratorBoost',
  'multiplier'
] as const

export type hepteractTypes = typeof hepteractTypeList[number] */

export class HepteractCraft {
  /**
   * Craft is unlocked or not (Default is locked)
   */
  UNLOCKED: () => boolean

  /**
   * Current Inventory (amount) of craft you possess
   */
  BAL = 0

  /**
   * Maximum Inventory (amount) of craft you can hold
   * base_cap is the smallest capacity for such item.
   */
  TIMES_CAP_EXTENDED = 0
  BASE_CAP = 0

  /**
   * Conversion rate of hepteract to synthesized items
   */
  HEPTERACT_CONVERSION = 0

  /**
   * Automatic crafting toggle. If on, allows crafting to be done automatically upon ascension.
   */
  AUTO = false

  RESET_ON_SINGULARITY = true

  /**
   * Conversion rate of additional items
   * This is in the form of keys being player variables,
   * values being the amount player has.
   */
  OTHER_CONVERSIONS: {
    [key in keyof Player]?: number
  }

  /**
   * String Prefix used for HTML DOM manipulation
   */
  #key: HepteractNames

  constructor (data: IHepteractCraft, key: HepteractNames) {
    this.BASE_CAP = data.BASE_CAP
    this.HEPTERACT_CONVERSION = data.HEPTERACT_CONVERSION
    this.OTHER_CONVERSIONS = data.OTHER_CONVERSIONS
    this.UNLOCKED = data.UNLOCKED ?? false // This would basically always be true if this parameter is provided
    this.BAL = data.BAL ?? 0
    this.TIMES_CAP_EXTENDED = data.TIMES_CAP_EXTENDED ?? this.BASE_CAP // This sets cap either as previous value or keeps it to default.
    this.AUTO = data.AUTO ?? false

    this.RESET_ON_SINGULARITY = data.RESET_ON_SINGULARITY ?? true

    this.#key = key

    void this.toggleAutomatic(this.AUTO)
  }

  computeCapWithExpansions = (): number => {
    return this.BASE_CAP * Math.pow(2, this.TIMES_CAP_EXTENDED)
  }

  computeMultiplier = (): number => {
    const valToCheck = player.singularityChallenges.limitedAscensions.rewards.hepteractCap
    return valToCheck ? 2 : 1
  }

  computeActualCap = (): number => {
    return this.computeCapWithExpansions() * this.computeMultiplier()
  }

  // Add to balance through crafting.
  craft = async (max = false): Promise<HepteractCraft | void> => {
    let craftAmount = null
    const heptCap = this.computeActualCap()
    const craftCostMulti = calculateSingularityDebuff('Hepteract Costs')
    // If craft is unlocked, we return object
    if (!this.UNLOCKED) {
      return Alert(i18next.t('hepteracts.notUnlocked'))
    }

    if (heptCap - this.BAL <= 0) {
      if (player.toggles[35]) {
        return Alert(i18next.t('hepteracts.reachedCapacity', { x: format(heptCap, 0, true) }))
      }
    }

    if (isNaN(player.wowAbyssals) || !isFinite(player.wowAbyssals) || player.wowAbyssals < 0) {
      player.wowAbyssals = 0
    }

    // Calculate the largest craft amount possible, with an upper limit being craftAmount
    const hepteractLimit = Math.floor(
      player.wowAbyssals / (this.HEPTERACT_CONVERSION * craftCostMulti)
    )

    // Create an array of how many we can craft using our conversion limits for additional items
    const itemLimits: number[] = []
    for (const item in this.OTHER_CONVERSIONS) {
      const indexableItem = item as keyof Player
      // The type of player[item] is number | Decimal | Cube.
      if (item === 'worlds') {
        itemLimits.push(
          Math.floor((player[indexableItem] as number) / (this.OTHER_CONVERSIONS[indexableItem] ?? 1))
        )
      } else if (isDecimal(player[indexableItem])) {
        itemLimits.push(
          Decimal.min(
            Decimal.floor(
              (player[indexableItem] as Decimal).div(craftCostMulti * this.OTHER_CONVERSIONS[indexableItem]!)
            ),
            1e300
          ).toNumber()
        )
      } else {
        itemLimits.push(
          Math.floor((player[indexableItem] as number) / (this.OTHER_CONVERSIONS[indexableItem] ?? 1))
        )
      }
    }

    // Get the smallest of the array we created
    const smallestItemLimit = Math.min(...itemLimits)

    let amountToCraft = Math.min(smallestItemLimit, hepteractLimit, heptCap, heptCap - this.BAL)

    // Return if the material is not a calculable number
    if (isNaN(amountToCraft) || !isFinite(amountToCraft)) {
      return Alert(i18next.t('hepteracts.executionFailed'))
    }

    // Prompt used here. Thank you Khafra for the already made code! -Platonic
    if (!max) {
      const craftingPrompt = await Prompt(i18next.t('hepteracts.craft', {
        x: format(amountToCraft, 0, true),
        y: Math.floor(amountToCraft / heptCap * 10000) / 100
      }))

      if (craftingPrompt === null) { // Number(null) is 0. Yeah..
        if (player.toggles[35]) {
          return Alert(i18next.t('hepteracts.cancelled'))
        } else {
          return // If no return, then it will just give another message
        }
      }
      craftAmount = Number(craftingPrompt)
    } else {
      craftAmount = heptCap
    }

    // Check these lol
    if (isNaN(craftAmount) || !isFinite(craftAmount) || !Number.isInteger(craftAmount)) { // nan + Infinity checks
      return Alert(i18next.t('general.validation.finite'))
    } else if (craftAmount <= 0) { // 0 or less selected
      return Alert(i18next.t('general.validation.zeroOrLess'))
    }

    // Get the smallest of hepteract limit, limit found above and specified input
    amountToCraft = Math.min(smallestItemLimit, hepteractLimit, craftAmount, heptCap - this.BAL)

    if (max && player.toggles[35]) {
      const craftYesPlz = await Confirm(i18next.t('hepteracts.craftMax', {
        x: format(amountToCraft, 0, true),
        y: Math.floor(amountToCraft / heptCap * 10000) / 100
      }))

      if (!craftYesPlz) {
        return Alert(i18next.t('hepteracts.cancelled'))
      }
    }

    this.BAL = Math.min(heptCap, this.BAL + amountToCraft)
    this.updatePlayerVal()

    // Subtract spent items from player
    player.wowAbyssals -= amountToCraft * this.HEPTERACT_CONVERSION * craftCostMulti

    if (player.wowAbyssals < 0) {
      player.wowAbyssals = 0
    }

    for (const item of (Object.keys(this.OTHER_CONVERSIONS) as (keyof Player)[])) {
      if (typeof player[item] === 'number') {
        ;(player[item] as number) -= amountToCraft * craftCostMulti
          * this.OTHER_CONVERSIONS[item]!
      }

      if ((player[item] as number) < 0) {
        ;(player[item] as number) = 0
      } else if (player[item] instanceof Cube) {
        ;(player[item] as Cube).sub(
          amountToCraft * craftCostMulti * this.OTHER_CONVERSIONS[item]!
        )
      } else if (item === 'worlds') {
        player.worlds.sub(amountToCraft * this.OTHER_CONVERSIONS[item]!)
      } else if (player[item] instanceof Decimal) {
        ;(player[item] as Decimal).sub(
          new Decimal(amountToCraft).times(craftCostMulti).times(this.OTHER_CONVERSIONS[item]!)
        )
      }
    }

    if (player.toggles[35]) {
      if (!max) {
        return Alert(i18next.t('hepteracts.craftedHepteracts', { x: format(amountToCraft, 0, true) }))
      }

      return Alert(i18next.t('hepteracts.craftedHepteractsMax', { x: format(amountToCraft, 0, true) }))
    }
  }

  // Reduce balance through spending
  spend (amount: number): this {
    if (!this.UNLOCKED()) {
      return this
    }

    this.BAL -= amount
    this.updatePlayerVal()
    return this
  }

  // Expand your capacity
  /**
   * Expansion can only happen if your current balance is full.
   */
  expand = async (): Promise<HepteractCraft | void> => {
    const expandMultiplier = 2
    const currentBalance = this.BAL
    const heptCap = this.computeActualCap()
    const currHeptCapNoMulti = this.computeCapWithExpansions()

    if (!this.UNLOCKED) {
      return Alert(i18next.t('hepteracts.notUnlocked'))
    }

    // Below capacity
    if (this.BAL < currHeptCapNoMulti) {
      if (player.toggles[35]) {
        return Alert(i18next.t('hepteracts.notEnough'))
      } else {
        return
      }
    }

    const expandPrompt = await Confirm(i18next.t('hepteracts.expandPrompt', {
      x: format(currHeptCapNoMulti),
      y: format(heptCap),
      z: format(heptCap * expandMultiplier),
      a: format(expandMultiplier, 2, true)
    }))

    if (!expandPrompt) {
      return this
    }

    // Avoid a double-expand exploit due to player waiting to confirm until after autocraft fires and expands
    if (this.BAL !== currentBalance) {
      if (player.toggles[35]) {
        return Alert(i18next.t('hepteracts.doubleSpent'))
      } else {
        return
      }
    }

    // Empties inventory in exchange for doubling maximum capacity.
    this.BAL -= currHeptCapNoMulti
    this.BAL = Math.max(0, this.BAL)

    this.TIMES_CAP_EXTENDED += 1

    this.updatePlayerVal()

    if (player.toggles[35]) {
      return Alert(i18next.t('hepteracts.expandedInventory', {
        x: format(heptCap * expandMultiplier, 0, true)
      }))
    }
  }

  toggleAutomatic (newValue?: boolean): Promise<void> | this {
    const HTML = DOMCacheGetOrSet(`${this.#key}HepteractAuto`)

    // When newValue is empty, current value is toggled
    this.AUTO = newValue ?? !this.AUTO

    HTML.textContent = this.AUTO ? i18next.t('general.autoOnColon') : i18next.t('general.autoOffColon')
    HTML.style.border = `2px solid ${this.AUTO ? 'green' : 'red'}`

    this.updatePlayerVal()

    return this
  }

  autoCraft (heptAmount: number): this {
    const craftCostMulti = calculateSingularityDebuff('Hepteract Costs')
    let baseCap = this.computeCapWithExpansions()
    let heptCap = this.computeActualCap()

    // Calculate the largest craft amount possible, with an upper limit being craftAmount
    const hepteractLimitCraft = Math.floor(
      heptAmount / (craftCostMulti * this.HEPTERACT_CONVERSION)
    )

    // Create an array of how many we can craft using our conversion limits for additional items
    const itemLimits: number[] = []
    for (const item in this.OTHER_CONVERSIONS) {
      // When Auto is turned on, only Quarks and hepteracts are consumed.
      if (item === 'worlds') {
        itemLimits.push(
          Math.floor((player[item as keyof Player] as number) / this.OTHER_CONVERSIONS[item as keyof Player]!)
        )
      }
    }

    // Get the smallest of the array we created [If Empty, this will be infinite]
    const smallestItemLimit = Math.min(...itemLimits)

    let amountToCraft = Math.min(smallestItemLimit, hepteractLimitCraft)
    let amountCrafted = 0

    let craft = Math.min(heptCap - this.BAL, amountToCraft) // Always nonzero
    this.BAL += craft
    amountCrafted += craft
    amountToCraft -= craft

    while (this.BAL >= heptCap && amountToCraft >= baseCap) {
      this.BAL -= baseCap
      this.TIMES_CAP_EXTENDED += 1

      craft = Math.min(heptCap - this.BAL, amountToCraft)

      this.BAL += craft
      amountCrafted += craft
      amountToCraft -= craft

      heptCap = this.computeActualCap()
      baseCap = this.computeCapWithExpansions()
    }

    for (const item in this.OTHER_CONVERSIONS) {
      if (item === 'worlds') {
        player.worlds.sub(amountCrafted * this.OTHER_CONVERSIONS[item]!)
      }
    }

    player.wowAbyssals -= amountCrafted * craftCostMulti * this.HEPTERACT_CONVERSION
    if (player.wowAbyssals < 0) {
      player.wowAbyssals = 0
    }

    this.updatePlayerVal()

    return this
  }

  reset () {
    if (!this.RESET_ON_SINGULARITY) {
      return
    } else {
      this.BAL = 0
      this.TIMES_CAP_EXTENDED = 0
      // Obviously, don't want to revert the values of AUTO
      this.updatePlayerVal()
    }
  }

  updatePlayerVal () {
    player.hepteracts[this.#key] = { ...this.valueOf() }
  }

  updateVals ({
    BAL,
    TIMES_CAP_EXTENDED,
    AUTO
  }: {
    BAL: number
    TIMES_CAP_EXTENDED: number
    AUTO: boolean
  }) {
    this.BAL = BAL
    this.TIMES_CAP_EXTENDED = TIMES_CAP_EXTENDED
    this.AUTO = AUTO
    this.updatePlayerVal()
  }

  keyOf (): HepteractNames {
    return this.#key
  }

  valueOf () {
    return {
      BAL: this.BAL,
      TIMES_CAP_EXTENDED: this.TIMES_CAP_EXTENDED,
      AUTO: this.AUTO
    }
  }
}

const hepteractEffectiveValues = {
  chronos: {
    LIMIT: 1000,
    DR: 1 / 6
  },
  hyperrealism: {
    LIMIT: 1000,
    DR: 0.33
  },
  quark: {
    LIMIT: 1000,
    DR: 0.5
  },
  challenge: {
    LIMIT: 1000,
    DR: 1 / 6
  },
  abyss: {
    LIMIT: 1,
    DR: 0
  },
  accelerator: {
    LIMIT: 1000,
    DR: 0.2
  },
  acceleratorBoost: {
    LIMIT: 1000,
    DR: 0.2
  },
  multiplier: {
    LIMIT: 1000,
    DR: 0.2
  }
}

export const hepteractEffective = (data: HepteractNames) => {
  let effectiveValue = Math.min(player.hepteracts[data].BAL, hepteractEffectiveValues[data].LIMIT)
  let exponentBoost = 0
  if (data === 'chronos') {
    exponentBoost += 1 / 750 * player.platonicUpgrades[19]
  }
  if (data === 'quark') {
    exponentBoost += +player.singularityUpgrades.singQuarkHepteract.getEffect().bonus
    exponentBoost += +player.singularityUpgrades.singQuarkHepteract2.getEffect().bonus
    exponentBoost += +player.singularityUpgrades.singQuarkHepteract3.getEffect().bonus
    exponentBoost += +player.octeractUpgrades.octeractImprovedQuarkHept.getEffect().bonus
    exponentBoost += player.shopUpgrades.improveQuarkHept / 100
    exponentBoost += player.shopUpgrades.improveQuarkHept2 / 100
    exponentBoost += player.shopUpgrades.improveQuarkHept3 / 100
    exponentBoost += player.shopUpgrades.improveQuarkHept4 / 100
    exponentBoost += player.shopUpgrades.improveQuarkHept5 / 5000

    const amount = player.hepteracts[data].BAL
    if (1000 < amount && amount <= 1000 * Math.pow(2, 10)) {
      return effectiveValue * Math.pow(amount / 1000, 1 / 2 + exponentBoost)
    } else if (1000 * Math.pow(2, 10) < amount && amount <= 1000 * Math.pow(2, 18)) {
      return effectiveValue * Math.pow(Math.pow(2, 10), 1 / 2 + exponentBoost)
        * Math.pow(amount / (1000 * Math.pow(2, 10)), 1 / 4 + exponentBoost / 2)
    } else if (1000 * Math.pow(2, 18) < amount && amount <= 1000 * Math.pow(2, 44)) {
      return effectiveValue * Math.pow(Math.pow(2, 10), 1 / 2 + exponentBoost)
        * Math.pow(Math.pow(2, 8), 1 / 4 + exponentBoost / 2)
        * Math.pow(amount / (1000 * Math.pow(2, 18)), 1 / 6 + exponentBoost / 3)
    } else if (1000 * Math.pow(2, 44) < amount) {
      return effectiveValue * Math.pow(Math.pow(2, 10), 1 / 2 + exponentBoost)
        * Math.pow(Math.pow(2, 8), 1 / 4 + exponentBoost / 2)
        * Math.pow(Math.pow(2, 26), 1 / 6 + exponentBoost / 3)
        * Math.pow(amount / (1000 * Math.pow(2, 44)), 1 / 12 + exponentBoost / 6)
    }
  }
  if (player.hepteracts[data].BAL > hepteractEffectiveValues[data].LIMIT) {
    effectiveValue *= Math.pow(
      player.hepteracts[data].BAL / hepteractEffectiveValues[data].LIMIT,
      hepteractEffectiveValues[data].DR + exponentBoost
    )
  }

  return effectiveValue
}

export const hepteractDescriptions = (type: HepteractNames) => {
  DOMCacheGetOrSet('hepteractUnlockedText').style.display = 'block'
  DOMCacheGetOrSet('hepteractCurrentEffectText').style.display = 'block'
  DOMCacheGetOrSet('hepteractBalanceText').style.display = 'block'
  DOMCacheGetOrSet('powderDayWarpText').style.display = 'none'
  DOMCacheGetOrSet('hepteractCostText').style.display = 'block'

  const unlockedText = DOMCacheGetOrSet('hepteractUnlockedText')
  const effectText = DOMCacheGetOrSet('hepteractEffectText')
  const currentEffectText = DOMCacheGetOrSet('hepteractCurrentEffectText')
  const balanceText = DOMCacheGetOrSet('hepteractBalanceText')
  const costText = DOMCacheGetOrSet('hepteractCostText')
  const bonusCapacityText = DOMCacheGetOrSet('hepteractBonusCapacity')
  const craftCostMulti = calculateSingularityDebuff('Hepteract Costs')

  const multiplier = hepteracts[type].computeActualCap() / hepteracts[type].computeCapWithExpansions()
  bonusCapacityText.textContent = (multiplier > 1)
    ? `Hepteract capacities are currently multiplied by ${multiplier}. Expansions cost what they would if this multiplier were 1.`
    : ''
  let currentEffectRecord!: StringMap
  let oneCost!: string | Record<string, string>

  switch (type) {
    case 'chronos':
      currentEffectRecord = { x: format(hepteractEffective('chronos') * 6 / 100, 2, true) }
      oneCost = format(1e115 * craftCostMulti, 0, false)

      break
    case 'hyperrealism':
      currentEffectRecord = { x: format(hepteractEffective('hyperrealism') * 6 / 100, 2, true) }
      oneCost = format(1e80 * craftCostMulti, 0, true)
      break
    case 'quark':
      currentEffectRecord = { x: format(hepteractEffective('quark') * 5 / 100, 2, true) }
      oneCost = '100'
      break
    case 'challenge':
      currentEffectRecord = { x: format(hepteractEffective('challenge') * 5 / 100, 2, true) }
      oneCost = {
        y: format(1e11 * craftCostMulti),
        z: format(1e22 * craftCostMulti)
      }
      break
    case 'abyss':
      oneCost = format(69 * craftCostMulti)
      break
    case 'accelerator':
      currentEffectRecord = {
        x: format(2000 * hepteractEffective('accelerator'), 2, true),
        y: format(hepteractEffective('accelerator') * 3 / 100, 2, true)
      }
      oneCost = format(1e14 * craftCostMulti)
      break
    case 'acceleratorBoost':
      currentEffectRecord = { x: format(hepteractEffective('acceleratorBoost') / 10, 2, true) }
      oneCost = format(1e10 * craftCostMulti)
      break
    case 'multiplier':
      currentEffectRecord = {
        x: format(1000 * hepteractEffective('multiplier'), 2, true),
        y: format(hepteractEffective('multiplier') * 3 / 100, 2, true)
      }
      oneCost = format(1e130 * craftCostMulti)
      break
  }

  effectText.textContent = i18next.t(`wowCubes.hepteractForge.descriptions.${type}.effect`)
  currentEffectText.textContent = i18next.t(
    `wowCubes.hepteractForge.descriptions.${type}.currentEffect`,
    currentEffectRecord
  )
  balanceText.textContent = i18next.t('wowCubes.hepteractForge.inventory', {
    x: format(hepteracts[type].BAL, 0, true),
    y: format(hepteracts[type].computeActualCap(), 0, true)
  })
  const record = typeof oneCost === 'string' ? { y: oneCost } : oneCost
  costText.textContent = i18next.t(`wowCubes.hepteractForge.descriptions.${type}.oneCost`, {
    x: format(hepteracts[type].HEPTERACT_CONVERSION * craftCostMulti, 0, true),
    ...record
  })

  unlockedText.textContent = hepteracts[type].UNLOCKED()
    ? i18next.t('wowCubes.hepteractForge.unlocked')
    : i18next.t('wowCubes.hepteractForge.locked')
}

/**
 * Generates the description at the bottom of the page for Overflux Orb crafting
 */
export const hepteractToOverfluxOrbDescription = () => {
  DOMCacheGetOrSet('hepteractUnlockedText').style.display = 'none'
  DOMCacheGetOrSet('powderDayWarpText').style.display = 'none'
  DOMCacheGetOrSet('hepteractCostText').style.display = 'block'

  DOMCacheGetOrSet('hepteractCurrentEffectText').textContent = i18next.t('hepteracts.orbEffect', {
    x: format(100 * (-1 + calculateCubeQuarkMultiplier()), 2, true)
  })
  DOMCacheGetOrSet('hepteractBalanceText').textContent = i18next.t('hepteracts.orbsPurchasedToday', {
    x: format(player.overfluxOrbs, 0, true)
  })
  DOMCacheGetOrSet('hepteractEffectText').textContent = i18next.t('hepteracts.amalgamate')
  DOMCacheGetOrSet('hepteractCostText').textContent = i18next.t('hepteracts.cost250k')
}

/**
 * Trades Hepteracts for Overflux Orbs at 250,000 : 1 ratio. If null or invalid will gracefully terminate.
 * @returns Alert of either purchase failure or success
 */
export const tradeHepteractToOverfluxOrb = async (buyMax?: boolean) => {
  const maxBuy = Math.floor(player.wowAbyssals / 250000)
  let toUse: number

  if (buyMax) {
    if (player.toggles[35]) {
      const craftYesPlz = await Confirm(i18next.t('hepteracts.craftMaxOrbs', { x: format(maxBuy, 0, true) }))
      if (!craftYesPlz) {
        return Alert(i18next.t('hepteracts.cancelled'))
      }
    }
    toUse = maxBuy
  } else {
    const hepteractInput = await Prompt(i18next.t('hepteracts.hepteractInput', { x: format(maxBuy, 0, true) }))
    if (hepteractInput === null) {
      if (player.toggles[35]) {
        return Alert(i18next.t('hepteracts.cancelled'))
      } else {
        return
      }
    }

    toUse = Number(hepteractInput)
    if (
      isNaN(toUse)
      || !isFinite(toUse)
      || !Number.isInteger(toUse)
      || toUse <= 0
    ) {
      return Alert(i18next.t('general.validation.invalidNumber'))
    }
  }

  const buyAmount = Math.min(maxBuy, Math.floor(toUse))
  const beforeEffect = calculateCubeQuarkMultiplier()
  player.overfluxOrbs += buyAmount
  player.wowAbyssals -= 250000 * buyAmount
  const afterEffect = calculateCubeQuarkMultiplier()

  if (player.wowAbyssals < 0) {
    player.wowAbyssals = 0
  }

  const powderGain = player.shopUpgrades.powderAuto * calculatePowderConversion() * buyAmount / 100
  player.overfluxPowder += powderGain

  const powderText = (powderGain > 0) ? i18next.t('hepteracts.gainedPowder', { x: format(powderGain, 2, true) }) : ''
  if (player.toggles[35]) {
    return Alert(i18next.t('hepteracts.purchasedOrbs', {
      x: format(buyAmount, 0, true),
      y: format(100 * (afterEffect - beforeEffect), 2, true),
      z: powderText
    }))
  }
}

export const toggleAutoBuyOrbs = (newValue?: boolean, firstLoad = false) => {
  const HTML = DOMCacheGetOrSet('hepteractToQuarkTradeAuto')

  if (!firstLoad) {
    // When newValue is empty, current value is toggled
    player.overfluxOrbsAutoBuy = newValue ?? !player.overfluxOrbsAutoBuy
  }

  HTML.textContent = player.overfluxOrbsAutoBuy ? i18next.t('general.autoOnColon') : i18next.t('general.autoOffColon')
  HTML.style.border = `2px solid ${player.overfluxOrbsAutoBuy ? 'green' : 'red'}`
}

/**
 * Generates the description at the bottom of the page for Overflux Powder Properties
 */
export const overfluxPowderDescription = () => {
  let powderEffectText: string
  if (player.platonicUpgrades[16] > 0) {
    powderEffectText = i18next.t('hepteracts.allCubeGainExtended', {
      x: format(100 * (calculateCubeMultFromPowder() - 1), 2, true),
      y: format(100 * (calculateQuarkMultFromPowder() - 1), 3, true),
      z: format(2 * player.platonicUpgrades[16] * Math.min(1, player.overfluxPowder / 1e5), 2, true),
      a: format(Decimal.pow(player.overfluxPowder + 1, 10 * player.platonicUpgrades[16]))
    })
  } else {
    powderEffectText = i18next.t('hepteracts.allCubeGain', {
      x: format(100 * (calculateCubeMultFromPowder() - 1), 2, true),
      y: format(100 * (calculateQuarkMultFromPowder() - 1), 3, true)
    })
  }
  DOMCacheGetOrSet('hepteractUnlockedText').style.display = 'none'
  DOMCacheGetOrSet('hepteractCurrentEffectText').textContent = i18next.t('hepteracts.powderEffect', {
    x: powderEffectText
  })
  DOMCacheGetOrSet('hepteractBalanceText').textContent = i18next.t('hepteracts.powderLumps', {
    x: format(player.overfluxPowder, 2, true)
  })
  DOMCacheGetOrSet('hepteractEffectText').textContent = i18next.t('hepteracts.expiredOrbs', {
    x: format(1 / calculatePowderConversion(), 1, true)
  })
  DOMCacheGetOrSet('hepteractCostText').style.display = 'none'

  DOMCacheGetOrSet('powderDayWarpText').style.display = 'block'
  DOMCacheGetOrSet('powderDayWarpText').textContent = i18next.t('hepteracts.dayWarpsRemaining', {
    x: player.dailyPowderResetUses
  })
}

/**
 * Attempts to operate a 'Day Reset' which, if successful, resets Daily Cube counters for the player.
 * Note by Platonic: kinda rushed job but idk if it can be improved.
 * @returns Alert, either for success or failure of warping
 */
export const overfluxPowderWarp = async (auto: boolean) => {
  if (!auto) {
    if (player.autoWarpCheck) {
      return Alert(i18next.t('hepteracts.warpImpossible'))
    }
    if (player.dailyPowderResetUses <= 0) {
      return Alert(i18next.t('hepteracts.machineCooldown'))
    }
    if (player.overfluxPowder < 25) {
      return Alert(i18next.t('hepteracts.atleastPowder'))
    }
    const c = await Confirm(i18next.t('hepteracts.stumbleMachine'))
    if (!c) {
      if (player.toggles[35]) {
        return Alert(i18next.t('hepteracts.walkAwayMachine'))
      }
    } else {
      player.overfluxPowder -= 25
      player.dailyPowderResetUses -= 1
      forcedDailyReset()
      if (player.toggles[35]) {
        return Alert(i18next.t('hepteracts.useMachine'))
      }
    }
  } else {
    if (player.autoWarpCheck) {
      const a = await Confirm(i18next.t('hepteracts.useAllWarpsPrompt'))
      if (a) {
        DOMCacheGetOrSet('warpAuto').textContent = i18next.t('general.autoOffColon')
        DOMCacheGetOrSet('warpAuto').style.border = '2px solid red'
        player.autoWarpCheck = false
        player.dailyPowderResetUses = 0
        return Alert(i18next.t('hepteracts.machineCooldown'))
      } else {
        if (player.toggles[35]) {
          return Alert(i18next.t('hepteracts.machineDidNotConsume'))
        }
      }
    } else {
      const a = await Confirm(i18next.t('hepteracts.boostQuarksPrompt'))
      if (a) {
        DOMCacheGetOrSet('warpAuto').textContent = i18next.t('general.autoOnColon')
        DOMCacheGetOrSet('warpAuto').style.border = '2px solid green'
        player.autoWarpCheck = true
        if (player.dailyPowderResetUses === 0) {
          return Alert(i18next.t('hepteracts.machineOverdrive'))
        }
        return Alert(i18next.t('hepteracts.machineInOverdrive'))
      } else {
        if (player.toggles[35]) {
          return Alert(i18next.t('hepteracts.machineUsualContinue'))
        }
      }
    }
  }
}

/**
 * Get the HepteractCrafts which are unlocked and auto = ON
 * @returns Array of HepteractCraft
 */
export const getAutoHepteractCrafts = () => {
  const autoHepteracts: HepteractCraft[] = []
  for (const craftName of Object.keys(hepteracts)) {
    const craftKey = craftName as HepteractNames
    if (hepteracts[craftKey].AUTO && hepteracts[craftKey].UNLOCKED()) {
      autoHepteracts.push(hepteracts[craftKey])
    }
  }
  return autoHepteracts
}

export const hepteractData: Record<HepteractNames, IHepteractCraft> = {
  chronos: {
    BASE_CAP: 1000,
    HEPTERACT_CONVERSION: 1e4,
    OTHER_CONVERSIONS: { obtainium: 1e115 },
    UNLOCKED: () => true,
    RESET_ON_SINGULARITY: true
  },
  hyperrealism: {
    BASE_CAP: 1000,
    HEPTERACT_CONVERSION: 1e4,
    OTHER_CONVERSIONS: { offerings: 1e80 },
    UNLOCKED: () => true,
    RESET_ON_SINGULARITY: true
  },
  quark: {
    BASE_CAP: 1000,
    HEPTERACT_CONVERSION: 1e4,
    OTHER_CONVERSIONS: { worlds: 100 },
    UNLOCKED: () => true,
    RESET_ON_SINGULARITY: false
  },
  challenge: {
    BASE_CAP: 1000,
    HEPTERACT_CONVERSION: 5e4,
    OTHER_CONVERSIONS: { wowPlatonicCubes: 1e11, wowCubes: 1e22 },
    UNLOCKED: () => {
      const condition = Globals.challenge15Rewards.challengeHepteractUnlocked.value
      return Boolean(condition)
    },
    RESET_ON_SINGULARITY: true
  },
  abyss: {
    BASE_CAP: 1,
    HEPTERACT_CONVERSION: 1e8,
    OTHER_CONVERSIONS: { wowCubes: 69 },
    UNLOCKED: () => {
      const condition = Globals.challenge15Rewards.abyssHepteractUnlocked.value
      return Boolean(condition)
    },
    RESET_ON_SINGULARITY: true
  },
  accelerator: {
    BASE_CAP: 1000,
    HEPTERACT_CONVERSION: 1e5,
    OTHER_CONVERSIONS: { wowTesseracts: 1e14 },
    UNLOCKED: () => {
      const condition = Globals.challenge15Rewards.acceleratorHepteractUnlocked.value
      return Boolean(condition)
    },
    RESET_ON_SINGULARITY: true
  },
  acceleratorBoost: {
    BASE_CAP: 1000,
    HEPTERACT_CONVERSION: 2e5,
    OTHER_CONVERSIONS: { wowHypercubes: 1e10 },
    UNLOCKED: () => {
      const condition = Globals.challenge15Rewards.acceleratorBoostHepteractUnlocked.value
      return Boolean(condition)
    },
    RESET_ON_SINGULARITY: true
  },
  multiplier: {
    BASE_CAP: 1000,
    HEPTERACT_CONVERSION: 3e5,
    OTHER_CONVERSIONS: { obtainium: 1e130 },
    UNLOCKED: () => {
      const condition = Globals.challenge15Rewards.multiplierHepteractUnlocked.value
      return Boolean(condition)
    },
    RESET_ON_SINGULARITY: true
  }
}

export type HepteractsMap = Record<HepteractNames, HepteractCraft>

export let hepteracts: HepteractsMap

export function initHepteracts (
  presets: Record<HepteractNames, {
    BAL: number
    TIMES_CAP_EXTENDED: number
    AUTO: boolean
  }>
) {
  if (hepteracts !== undefined) {
    for (const key of Object.keys(hepteracts) as HepteractNames[]) {
      hepteracts[key].updateVals(presets[key])
    }
  } else {
    const upgrades = {} as HepteractsMap
    const keys = Object.keys(hepteractData) as HepteractNames[]

    // Use type assertions after careful validation
    for (const key of keys) {
      const data = hepteractData[key]
      const invested = presets[key]

      const dataWithInvestment = {
        ...data,
        ...invested
      }

      // Use a function that casts the result appropriately
      upgrades[key] = new HepteractCraft(dataWithInvestment, key)
    }

    hepteracts = upgrades as HepteractsMap
  }
}

export function getHepteract (key: HepteractNames) {
  if (hepteracts === undefined) {
    throw new Error('Hepteracts not initialized. Call initHepteracts first.')
  }
  return hepteracts[key]
}

export function resetHepteracts () {
  if (hepteracts === undefined) {
    throw new Error('Hepteracts not initialized. Call initHepteracts first.')
  }

  for (const key of Object.keys(hepteracts) as HepteractNames[]) {
    hepteracts[key].reset()
  }
}
