import Decimal from 'break_infinity.js'
import i18next from 'i18next'
import { DOMCacheGetOrSet } from './Cache/DOM'
import { CalcCorruptionStuff, calculateGlobalSpeedMult } from './Calculate'
import { format, player } from './Synergism'
import { Alert, Notification, revealStuff } from './UpdateHTML'
import { sumContents } from './Utility'
import { Globals as G } from './Variables'
import { antSacrificePointsToMultiplier } from './Ants'
import { getRune, getRuneBlessing, getRuneSpirit, sumOfRuneLevels } from './Runes'
import { getHepteract } from './Hepteracts'
import type { resetNames } from './types/Synergism'

// dprint-ignore
export const achievementpointvalues = [
  0,
  1, 2, 4, 6, 8, 9, 10, // 7
  1, 2, 4, 6, 8, 9, 10,
  1, 2, 4, 6, 8, 9, 10, // 21
  1, 2, 4, 6, 8, 9, 10,
  1, 2, 4, 6, 8, 9, 10, // 35
  1, 2, 4, 6, 8, 9, 10,
  1, 2, 4, 6, 8, 9, 10, // 49
  1, 2, 4, 6, 8, 9, 10,
  2, 8, 10, 2, 8, 10, 10, // 63
  2, 8, 10, 10, 10, 10, 10,
  2, 4, 6, 8, 10, 10, 10, // 77
  1, 2, 4, 6, 8, 9, 10,
  1, 2, 4, 6, 8, 9, 10, // 91
  1, 2, 4, 6, 8, 9, 10,
  1, 2, 4, 6, 8, 9, 10, // 105
  1, 2, 4, 6, 8, 9, 10,
  1, 2, 4, 6, 8, 9, 10, // 119
  1, 2, 4, 6, 8, 9, 10,
  1, 2, 4, 6, 8, 9, 10, // 133
  1, 2, 4, 6, 8, 9, 10,
  1, 2, 4, 6, 8, 9, 10, // 147
  1, 2, 4, 6, 8, 9, 10,
  1, 2, 4, 6, 8, 9, 10, // 161
  1, 2, 4, 6, 8, 9, 10,
  10, 10, 10, 10, 10, 10, 10, // 175
  10, 10, 10, 10, 10, 10, 10, // 182
  20, 20, 20, 40, 60, 60, 100, // 189
  20, 20, 40, 40, 60, 60, 100, // 196
  20, 20, 40, 40, 60, 60, 100, // 203
  20, 40, 40, 40, 60, 60, 100, // 210
  40, 40, 40, 60, 60, 100, 100, // 217
  40, 40, 60, 60, 100, 100, 100, // 224
  20, 40, 40, 60, 60, 100, 100, // 231
  40, 60, 100, 60, 100, 100, 40, // 238
  40, 40, 40, 40, 40, 40, 40, // 245
  40, 40, 40, 40, 100, 100, 45, // 252
  50, 75, 75, 75, 100, 100, 150, // 259
  50, 75, 75, 75, 100, 100, 150, // 266
  50, 75, 75, 75, 100, 100, 150, // 273
  10, 10, 20, 20, 30, 40, 50 // 280
]

export const totalachievementpoints = achievementpointvalues.reduce((a, b) => a + b, 0)

export const areward = (i: number): string => {
  // May 22, 2021: Allow achievement bonus values display directly in the description
  // Using areward as const object did not allow ${player object}

  // Effective score is 3rd index
  const corr = CalcCorruptionStuff()

  const extra: Record<number, string | Record<string, string>> = {
    118: format(
      Math.pow(
        0.9925,
        player.challengecompletions[6] + player.challengecompletions[7] + player.challengecompletions[8]
          + player.challengecompletions[9] + player.challengecompletions[10]
      ),
      4
    ),
    169: format(Decimal.log(player.antPoints.add(10), 10), 2),
    174: format(0.4 * Decimal.log(player.antPoints.add(1), 10), 2),
    187: {
      x: format(Math.max(1, Math.log10(corr[3] + 1) - 7), 2),
      y: format(Math.min(100, player.ascensionCount / 10000), 2)
    },
    188: format(Math.min(100, player.ascensionCount / 50000), 2),
    189: format(Math.min(200, player.ascensionCount / 2.5e6), 2),
    193: format(Decimal.log(player.ascendShards.add(1), 10) / 4, 2),
    195: format(Math.min(25000, Decimal.log(player.ascendShards.add(1), 10) / 4), 2),
    196: format(Math.min(2000, Decimal.log(player.ascendShards.add(1), 10) / 50), 2),
    202: format(Math.min(200, player.ascensionCount / 5e6), 2),
    216: format(Math.min(200, player.ascensionCount / 1e7), 2),
    223: format(Math.min(200, player.ascensionCount / 13370000), 2),
    240: format(Math.min(1.5, 1 + Math.max(2, Math.log10(calculateGlobalSpeedMult())) / 20), 2),
    254: format(Math.min(15, Math.log10(corr[3] + 1) * 0.6), 2, true),
    255: format(Math.min(15, Math.log10(corr[3] + 1) * 0.6), 2, true),
    256: format(Math.min(15, Math.log10(corr[3] + 1) * 0.6), 2, true),
    257: format(Math.min(15, Math.log10(corr[3] + 1) * 0.6), 2, true),
    258: format(Math.min(15, Math.log10(corr[3] + 1) * 0.6), 2, true),
    262: format(Math.min(10, Math.log10(player.ascensionCount + 1)), 2),
    263: format(Math.min(10, Math.log10(player.ascensionCount + 1)), 2),
    264: format(Math.min(40, player.ascensionCount / 2e11), 2),
    265: format(Math.min(20, player.ascensionCount / 8e12), 2),
    266: format(Math.min(10, player.ascensionCount / 1e14), 2),
    267: format(Math.min(100, Decimal.log(player.ascendShards.add(1), 10) / 1000), 2),
    270: format(Math.min(100, Decimal.log(player.ascendShards.add(1), 10) / 10000), 2),
    271: format(Math.max(0, Math.min(1, (Decimal.log(player.ascendShards.add(1), 10) - 1e5) / 9e5)), 2, true)
  }

  // dprint-ignore
  const descs: number[] = [
    3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19,
    20, 21, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35,
    36, 37, 38, 43, 44, 45, 46, 47, 50, 51, 52, 53,
    57, 58, 59, 60, 61, 62, 71, 72, 73, 74, 75, 76,
    77, 78, 79, 80, 82, 84, 85, 86, 87, 89, 91, 92,
    93, 94, 96, 98, 99, 100, 101, 102, 103, 105, 106,
    107, 108, 110, 112, 115, 117, 119, 122, 124, 126,
    127, 128, 129, 131, 132, 133, 134, 135, 136, 137,
    140, 141, 147, 171, 172, 173, 176, 177, 178, 179,
    180, 181, 182, 186, 197, 198, 199, 200, 201, 204, 205,
    206, 207, 208, 209, 211, 212, 213, 214, 215, 218,
    219, 220, 221, 222, 250, 251, 253, 259, 260, 261
  ]

  if (descs.includes(i) || i in extra) {
    const obj = extra[i]
    const map = typeof obj === 'object' ? obj : { x: obj }

    return i18next.t(`achievements.rewards.${i}`, map)
  }

  return ''
}

export const achievementAlerts = async (num: number) => {
  if (player.highestSingularityCount === 0) {
    if (num === 36 || num === 38 || num === 255) {
      return Alert(i18next.t(`achievements.alerts.${num}`))
    }
  }
}
// ${format(Decimal.log(player.ascendShards.add(1), 10) / 1000, 2)} (log(constant)/1000)%!

// TODO: clean this up
export const resetAchievementCheck = (reset: resetNames) => {
  if (reset === 'prestige') {
    achievementManager.tryUnlock(ungroupedNameMap.prestigeNoAccelerator)
    achievementManager.tryUnlock(ungroupedNameMap.prestigeNoMult)
    achievementManager.tryUnlock(ungroupedNameMap.prestigeNoCoinUpgrade)
    achievementManager.tryUnlockByGroup('prestigePointGain')
  }
  if (reset === 'transcension') {
    achievementManager.tryUnlock(ungroupedNameMap.transcendNoAccelerator)
    achievementManager.tryUnlock(ungroupedNameMap.transcendNoMult)
    achievementManager.tryUnlock(ungroupedNameMap.transcendNoCoinUpgrade)
    achievementManager.tryUnlock(ungroupedNameMap.transcendNoCoinDiamondUpgrade)
    achievementManager.tryUnlockByGroup('transcendPointGain')
  }
  if (reset === 'reincarnation') {

    achievementManager.tryUnlock(ungroupedNameMap.reincarnationNoAccelerator)
    achievementManager.tryUnlock(ungroupedNameMap.reincarnationNoMult)
    achievementManager.tryUnlock(ungroupedNameMap.reincarnationNoCoinUpgrade)
    achievementManager.tryUnlock(ungroupedNameMap.reincarnationNoCoinDiamondUpgrade)
    achievementManager.tryUnlock(ungroupedNameMap.reincarnationNoCoinDiamondMythosUpgrade)
    achievementManager.tryUnlock(ungroupedNameMap.reincarnationMinimumUpgrades)
    achievementManager.tryUnlockByGroup('reincarnationPointGain')

  }
}

/**
 * Array of [index, bar to get achievement if greater than, achievement number]
 */
// dprint-ignore
const challengeCompletionsBar: [number, number, number][] = [
  [1, 0.5, 78], [1, 2.5, 79], [1, 4.5, 80], [1, 9.5, 81], [1, 19.5, 82], [1, 49.5, 83], [1, 74.5, 84],
  [2, 0.5, 85], [2, 2.5, 86], [2, 4.5, 87], [2, 9.5, 88], [2, 19.5, 89], [2, 49.5, 90], [2, 74.5, 91],
  [3, 0.5, 92], [3, 2.5, 93], [3, 4.5, 94], [3, 9.5, 95], [3, 19.5, 96], [3, 49.5, 97], [3, 74.5, 98],
  [4, 0.5, 99], [4, 2.5, 100], [4, 4.5, 101], [4, 9.5, 102], [4, 19.5, 103], [4, 49.5, 104], [4, 74.5, 105],
  [5, 0.5, 106], [5, 2.5, 107], [5, 4.5, 108], [5, 9.5, 109], [5, 19.5, 110], [5, 49.5, 111], [5, 74.5, 112],
  [6, 0.5, 113], [6, 1.5, 114], [6, 2.5, 115], [6, 4.5, 116], [6, 9.5, 117], [6, 14.5, 118], [6, 24.5, 119],
  [7, 0.5, 120], [7, 1.5, 121], [7, 2.5, 122], [7, 4.5, 123], [7, 9.5, 124], [7, 14.5, 125], [7, 24.5, 126],
  [8, 0.5, 127], [8, 1.5, 128], [8, 2.5, 129], [8, 4.5, 130], [8, 9.5, 131], [8, 19.5, 132], [8, 24.5, 133],
  [9, 0.5, 134], [9, 1.5, 135], [9, 2.5, 136], [9, 4.5, 137], [9, 9.5, 138], [9, 19.5, 139], [9, 24.5, 140],
  [10, 0.5, 141], [10, 1.5, 142], [10, 2.5, 143], [10, 4.5, 144], [10, 9.5, 145], [10, 19.5, 146], [10, 24.5, 147],
  [15, 0.5, 252]
]

const challengeCompletionsNotAuto: Record<number, [string, number]> = {
  1: ['1e1000', 75],
  2: ['1e1000', 76],
  3: ['1e99999', 77],
  5: ['1e120000', 63]
}

export const challengeachievementcheck = (i: number, auto?: boolean) => {
  const generatorcheck = sumContents(player.upgrades.slice(101, 106))

  for (const [, bar, ach] of challengeCompletionsBar.filter(([o]) => o === i)) {
    if (player.challengecompletions[i] > bar && player.achievements[ach] < 1) {
      achievementaward(ach)
    }
  }

  // Challenges 1, 2, 3 check for not buying generators and getting X coins
  // Challenge 5 check for not buying Acc/Acc Boosts and getting 1.00e120,000 coins
  if ([1, 2, 3, 5].includes(i) && !auto) {
    const [gte, ach] = challengeCompletionsNotAuto[i]
    if (i === 5) {
      if (
        player.coinsThisTranscension.gte(gte) && player.acceleratorBought === 0 && player.acceleratorBoostBought === 0
      ) {
        achievementaward(ach)
      }
    } else if (player.coinsThisTranscension.gte(gte) && generatorcheck === 0) {
      achievementaward(ach)
    }
  }

  if (i >= 11 && i <= 14) {
    const challengeArray = [0, 1, 2, 3, 5, 10, 20, 30]
    for (let j = 1; j <= 7; j++) {
      if (player.challengecompletions[i] >= challengeArray[j] && player.achievements[119 + 7 * i + j] < 1) {
        achievementaward(119 + 7 * i + j)
      }
    }
  }

  if (
    player.challengecompletions[10] >= 50 && i === 11 && player.corruptions.used.extinction >= 5
    && player.achievements[247] < 1
  ) {
    achievementaward(247)
  }
}

export const buildingAchievementCheck = () => {
  achievementManager.tryUnlockByGroup('firstOwnedCoin')
  achievementManager.tryUnlockByGroup('secondOwnedCoin')
  achievementManager.tryUnlockByGroup('thirdOwnedCoin')
  achievementManager.tryUnlockByGroup('fourthOwnedCoin')
  achievementManager.tryUnlockByGroup('fifthOwnedCoin')
}

export const ascensionAchievementCheck = (i: number, score = 0) => {
  if (i === 1) {
    // dprint-ignore
    const ascendCountArray = [
      0, 1, 2, 10, 100, 1000, 14142, 141421, 1414213, // Column 1
      1e7, 1e8, 2e9, 4e10, 8e11, 1.6e13, 1e14 // Column 2
    ]

    for (let j = 1; j <= 7; j++) {
      if (player.ascensionCount >= ascendCountArray[j] && player.achievements[182 + j] < 1) {
        achievementaward(182 + j)
      }
      if (player.ascensionCount >= ascendCountArray[j + 8] && player.achievements[259 + j] < 1) {
        achievementaward(259 + j)
      }
    }
    if (player.ascensionCount >= ascendCountArray[8] && player.achievements[240] < 1) {
      achievementaward(240)
    }
  }
  if (i === 2) {
    // dprint-ignore
    const constantArray = [
      0, 3.14, 1e6, 4.32e10, 6.9e21, 1.509e33, 1e66, '1.8e308', // Column 1
      '1e1000', '1e5000', '1e15000', '1e50000', '1e100000', '1e300000', '1e1000000' // Column 2
    ]

    for (let j = 1; j <= 7; j++) {
      if (player.ascendShards.gte(constantArray[j]) && player.achievements[189 + j] < 1) {
        achievementaward(189 + j)
      }
      if (player.ascendShards.gte(constantArray[j + 7]) && player.achievements[266 + j] < 1) {
        achievementaward(266 + j)
      }
    }
  }
  if (i === 3) {
    // dprint-ignore
    const scoreArray = [
      0, 1e5, 1e6, 1e7, 1e8, 1e9, 5e9, 2.5e10, // Column 1
      1e12, 1e14, 1e17, 2e18, 4e19, 1e21, 1e23 // Column 2
    ]
    for (let j = 1; j <= 7; j++) {
      if (score >= scoreArray[j] && player.achievements[224 + j] < 1) {
        achievementaward(224 + j)
      }

      if (score >= scoreArray[7 + j] && player.achievements[252 + j] < 1) {
        achievementaward(252 + j)
      }
    }
  }
}

export const getAchievementQuarks = (i: number) => {

  const globalQuarkMultiplier = player.worlds.applyBonus(1)
  let actualMultiplier = globalQuarkMultiplier
  if (actualMultiplier > 100) {
    actualMultiplier = Math.pow(100, 0.6) * Math.pow(actualMultiplier, 0.4)
  }

  return Math.floor(achievements[i].pointValue * actualMultiplier)
}

export const achievementdescriptions = (i: number) => {
  const y = i18next.t(`achievements.descriptions.${i}`)
  const z = player.achievements[i] > 0.5 ? i18next.t('achievements.completed') : ''
  const k = areward(i)

  DOMCacheGetOrSet('achievementdescription').textContent = y + z
  DOMCacheGetOrSet('achievementreward').textContent = i18next.t('achievements.rewardGainMessage', {
    x: achievementpointvalues[i],
    y: format(getAchievementQuarks(i), 0, true),
    z: k
  })

  if (player.achievements[i] > 0.5) {
    DOMCacheGetOrSet('achievementdescription').style.color = 'gold'
  } else {
    DOMCacheGetOrSet('achievementdescription').style.color = 'white'
  }
}

export const achievementaward = (num: number) => {
  if (player.achievements[num] < 1) {
    if (player.toggles[34]) {
      const description = i18next.t(`achievements.descriptions.${num}`)
      void Notification(i18next.t('achievements.notification', { m: description }))
    }

    void achievementAlerts(num)
    player.achievementPoints += achievementpointvalues[num]
    player.worlds.add(getAchievementQuarks(num), false)

    DOMCacheGetOrSet('achievementprogress').textContent = i18next.t('achievements.totalPoints', {
      x: format(player.achievementPoints),
      y: format(totalachievementpoints),
      z: (100 * player.achievementPoints / totalachievementpoints).toPrecision(4)
    })

    DOMCacheGetOrSet('achievementQuarkBonus').innerHTML = i18next.t('achievements.quarkBonus', {
      multiplier: format(1 + player.achievementPoints / 50000, 3, true)
    })

    player.achievements[num] = 1
    revealStuff()
  }

  DOMCacheGetOrSet(`ach${num}`).classList.add('green-background')
}


/* June 9, 2025 Achievements System Rewrite */
export type AchievementGroups = 'firstOwnedCoin' | 'secondOwnedCoin' | 'thirdOwnedCoin' | 'fourthOwnedCoin' | 'fifthOwnedCoin' |
'prestigePointGain' | 'transcendPointGain' | 'reincarnationPointGain' | 'challenge1' | 'challenge2' | 'challenge3' | 'challenge4' | 'challenge5' |
'challenge6' | 'challenge7' | 'challenge8' | 'challenge9' | 'challenge10' | 'accelerators' | 'acceleratorBoosts' | 'multipliers' | 'antCrumbs' |
'sacMult' | 'ascensionCount' | 'constant' | 'challenge11' | 'challenge12' | 'challenge13' | 'challenge14' |
'ascensionScore' | 'speedBlessing' | 'speedSpirit' | 'singularityCount' | 'runeLevel' | 'runeFreeLevel' | 'ungrouped'

export type AchievementRewards = 'acceleratorPower' | 'workerAutobuyer' | 'investmentAutobuyer' | 'printerAutobuyer' | 'mintAutobuyer' | 'alchemyAutobuyer' |
'accelerators' | 'multipliers' | 'accelBoosts' | 'offeringPrestigeTimer' | 'crystalMultiplier' | 'duplicationRuneUnlock' |
'autoPrestigeFeature' | 'prismRuneUnlock' | 'taxReduction' | 'particleGain' | 'multiplicativeObtainium' | 'conversionExponent' |
'refineryAutobuy' | 'coalPlantAutobuy' | 'coalRigAutobuy' | 'pickaxeAutobuy' | 'pandorasBoxAutobuy' | 'crystalUpgrade1Autobuy' |
'crystalUpgrade2Autobuy' | 'crystalUpgrade3Autobuy' | 'crystalUpgrade4Autobuy' | 'crystalUpgrade5Autobuy' | 'recycleChance' | 'exemptionTalisman' | 'chronosTalisman' |
'midasTalisman' | 'metaphysicsTalisman' | 'polymathTalisman' | 'chal7Researches' | 'chal8Researches' | 'chal9Researches' | 
'talismanPower' | 'sacrificeMult' | 'ascensionUnlock' | 'antSpeed' | 'antSacrificeUnlock' | 'antAutobuyers' | 'antUpgradeAutobuyers' | 'antELOAdditive' | 'antELOMultiplicative' |
'wowSquareTalisman' | 'ascensionCountMultiplier' | 'ascensionCountAdditive' | 'multiplicativeOffering' | 'allCubeGain' | 'wowCubeGain' | 'wowTesseractGain' | 
'wowHypercubeGain' | 'wowPlatonicGain' | 'quarkGain' | 'wowHepteractGain' | 'ascensionScore' | 'constUpgrade1Buff' | 'constUpgrade2Buff' | 'platonicToHypercubes' |
'statTracker' | 'ascensionRewardScaling'


export type AchievementReward = Partial<Record<AchievementRewards, () => number>>

export interface Achievement {
  pointValue: number
  unlockCondition: () => boolean
  group: AchievementGroups
  reward?: AchievementReward
}

export class AchievementManager {
  
  achievementMap: { [index: number]: boolean } = {}
  _totalPoints: number

  constructor(achievements: number[]) {
    achievements.forEach((val, index) => {
      this.achievementMap[index] = val > 0
    })

    this._totalPoints = 0
    this.updateTotalPoints()
  }

  updateTotalPoints() {
    this._totalPoints = Object.entries(this.achievementMap)
      .filter(([, unlocked]) => unlocked)
      .reduce((sum, [index]) => sum + achievements[Number(index)].pointValue, 0)
  }

  updateAchievements(achievements: number[]) {
    achievements.forEach((val, index) => {
      this.achievementMap[index] = val > 0
    })
    this.updateTotalPoints()
  }

  get totalPoints () {
    return this._totalPoints
  }

  tryUnlock(i: number) {

    if (this.achievementMap[i]) {
      return // Already unlocked
    }

    const achievement = achievements[i]
    if (achievement?.unlockCondition()) {
      if (player.toggles[34]) {
        const description = i18next.t(`achievements.descriptions.${i}`)
        void Notification(i18next.t('achievements.notification', { m: description }))
      }
      this.achievementMap[i] = true
      this._totalPoints += achievement.pointValue
      player.worlds.add(getAchievementQuarks(i), false)
      revealStuff()
    }
  }

  tryUnlockByGroup(group: AchievementGroups) {

    if (group === 'ungrouped') {
      throw new Error('We do not support unlocking by Ungrouped for now!')
    }

    if (!achievementsByGroup[group]) {
      throw new Error(`Achievement group ${group} has no members!`);
    }

    for (const idx of achievementsByGroup[group]) {
      this.tryUnlock(idx)
    }
  }

  getBonus(reward: AchievementRewards) {
    return getAchieveReward[reward](this.achievementMap)
  }

  // Convert achievementMap to an array of numbers, where 1 means unlocked and 0 means not unlocked
  // Used when saving with the player schema
  get achArray(): number[] {
    return Object.values(this.achievementMap).map(val => (val ? 1 : 0))
  }

  get level(): number {
    if (this.totalPoints < 2500) {
      return Math.floor(this.totalPoints / 50)
    }
    else {
      return 50 + Math.floor((this.totalPoints - 2500) / 100)
    }
  }

  // Unlocks with level 0 (Default perk)
  get offeringBonus(): number {
    let percentage = 0
    const level = this.level
    percentage += 2 * level
    percentage += 2 * Math.max(0, level - 50)
    percentage += 2 * Math.max(0, level - 100)
    percentage += 2 * Math.max(0, level - 150)
    percentage += 2 * Math.max(0, level - 200)
    percentage *= Math.pow(1.01, Math.max(0, level - 250))

    return 1 + (percentage / 100)
  }

  // Unlocks with level 0 (Default perk)
  get salvageBonus(): number {
    return this.level
  }

  // Unlocks with level 5
  get obtainiumBonus(): number {
    let percentage = 0
    const level = this.level - 5
    percentage += 2 * level
    percentage += 2 * Math.max(0, level - 45)
    percentage += 2 * Math.max(0, level - 95)
    percentage += 2 * Math.max(0, level - 145)
    percentage += 2 * Math.max(0, level - 195)
    percentage *= Math.pow(1.01, Math.max(0, level - 245))

    return 1 + (percentage / 100)
  }

  // Unlocks with level 50
  get quarkBonus(): number {
    if (this.level < 50) {
      return 1
    }
    return 1 + 0.01 * Math.floor((this.level - 50) / 5)
  }

  // Unlocks with level 10
  get cubeBonus(): number {
    if (this.getBonus('ascensionUnlock')) {
      return 1 + 0.01 * Math.max(0, this.level - 10)
    }
    else {
      return 1
    }
  }

  // Unlocks with level 100
  get goldQuarkDiscountMultiplier(): number {
    if (this.level < 100) {
      return 1
    }
    return Math.pow(0.99, Math.floor(this.level - 100))
  }

  // Unlocks at level 100
  get ambrosiaLuck(): number {
    if (this.level < 100) {
      return 1
    }
    return 3 * Math.max(0, this.level - 100) + 2 * Math.max(0, this.level - 200)
  }

}

// NOTE: Right now, if achievements share a group, the one with the higher 'id' is known to be the one that is meant to be
// Unlocked last. This is a limitation I hope to eventually fix.
export const achievements: { [index: number]: Achievement } = {
  0: { pointValue: 0, unlockCondition: () => true, group: 'ungrouped'}, // Free Achievement Perhaps?
  1: { pointValue: 5, unlockCondition: () => player.firstOwnedCoin >= 1, group: 'firstOwnedCoin' },
  2: { pointValue: 10, unlockCondition: () => player.firstOwnedCoin >= 10, group: 'firstOwnedCoin' },
  3: { pointValue: 15, unlockCondition: () => player.firstOwnedCoin >= 100, group: 'firstOwnedCoin', reward: { acceleratorPower: () => 0.001 } },
  4: { pointValue: 20, unlockCondition: () => player.firstOwnedCoin >= 1000, group: 'firstOwnedCoin', reward: { workerAutobuyer: () => 1 } },
  5: { pointValue: 25, unlockCondition: () => player.firstOwnedCoin >= 5000, group: 'firstOwnedCoin', reward: { accelerators: () => Math.floor(player.firstOwnedCoin / 500) } },
  6: { pointValue: 30, unlockCondition: () => player.firstOwnedCoin >= 10000, group: 'firstOwnedCoin', reward: { multipliers: () => Math.floor(player.firstOwnedCoin / 1000) } },
  7: { pointValue: 35, unlockCondition: () => player.firstOwnedCoin >= 20000, group: 'firstOwnedCoin', reward: { accelBoosts: () => Math.floor(player.firstOwnedCoin / 2000) } },
  8: { pointValue: 5, unlockCondition: () => player.secondOwnedCoin >= 1, group: 'secondOwnedCoin' },
  9: { pointValue: 10, unlockCondition: () => player.secondOwnedCoin >= 10, group: 'secondOwnedCoin' },
  10: { pointValue: 15, unlockCondition: () => player.secondOwnedCoin >= 100, group: 'secondOwnedCoin', reward: { acceleratorPower: () => 0.0015 } },
  11: { pointValue: 20, unlockCondition: () => player.secondOwnedCoin >= 500, group: 'secondOwnedCoin', reward: { investmentAutobuyer: () => 1 } },
  12: { pointValue: 25, unlockCondition: () => player.secondOwnedCoin >= 5000, group: 'secondOwnedCoin', reward: { accelerators: () => Math.floor(player.secondOwnedCoin / 500) } },
  13: { pointValue: 30, unlockCondition: () => player.secondOwnedCoin >= 10000, group: 'secondOwnedCoin', reward: { multipliers: () => Math.floor(player.secondOwnedCoin / 1000) } },
  14: { pointValue: 35, unlockCondition: () => player.secondOwnedCoin >= 20000, group: 'secondOwnedCoin', reward: { accelBoosts: () => Math.floor(player.secondOwnedCoin / 2000) } },
  15: { pointValue: 5, unlockCondition: () => player.thirdOwnedCoin >= 1, group: 'thirdOwnedCoin' },
  16: { pointValue: 10, unlockCondition: () => player.thirdOwnedCoin >= 10, group: 'thirdOwnedCoin' },
  17: { pointValue: 15, unlockCondition: () => player.thirdOwnedCoin >= 100, group: 'thirdOwnedCoin', reward: { acceleratorPower: () => 0.002 } },
  18: { pointValue: 20, unlockCondition: () => player.thirdOwnedCoin >= 333, group: 'thirdOwnedCoin', reward: { printerAutobuyer: () => 1 } },
  19: { pointValue: 25, unlockCondition: () => player.thirdOwnedCoin >= 5000, group: 'thirdOwnedCoin', reward: { accelerators: () => Math.floor(player.thirdOwnedCoin / 500) } },
  20: { pointValue: 30, unlockCondition: () => player.thirdOwnedCoin >= 10000, group: 'thirdOwnedCoin', reward: { multipliers: () => Math.floor(player.thirdOwnedCoin / 1000) } },
  21: { pointValue: 35, unlockCondition: () => player.thirdOwnedCoin >= 20000, group: 'thirdOwnedCoin', reward: { accelBoosts: () => Math.floor(player.thirdOwnedCoin / 2000) } },
  22: { pointValue: 5, unlockCondition: () => player.fourthOwnedCoin >= 1, group: 'fourthOwnedCoin' },
  23: { pointValue: 10, unlockCondition: () => player.fourthOwnedCoin >= 10, group: 'fourthOwnedCoin' },
  24: { pointValue: 15, unlockCondition: () => player.thirdOwnedCoin >= 100, group: 'thirdOwnedCoin', reward: { acceleratorPower: () => 0.002 } },
  25: { pointValue: 20, unlockCondition: () => player.thirdOwnedCoin >= 333, group: 'thirdOwnedCoin', reward: { mintAutobuyer: () => 1 } },
  26: { pointValue: 25, unlockCondition: () => player.thirdOwnedCoin >= 5000, group: 'thirdOwnedCoin', reward: { accelerators: () => Math.floor(player.thirdOwnedCoin / 500) } },
  27: { pointValue: 30, unlockCondition: () => player.thirdOwnedCoin >= 10000, group: 'thirdOwnedCoin', reward: { multipliers: () => Math.floor(player.thirdOwnedCoin / 1000) } },
  28: { pointValue: 35, unlockCondition: () => player.thirdOwnedCoin >= 20000, group: 'thirdOwnedCoin', reward: { accelBoosts: () => Math.floor(player.thirdOwnedCoin / 2000) } },
  29: { pointValue: 5, unlockCondition: () => player.fifthOwnedCoin >= 1, group: 'fifthOwnedCoin' },
  30: { pointValue: 10, unlockCondition: () => player.fifthOwnedCoin >= 10, group: 'fifthOwnedCoin' },
  31: { pointValue: 15, unlockCondition: () => player.fifthOwnedCoin >= 66, group: 'fifthOwnedCoin', reward: { acceleratorPower: () => 0.003 } },
  32: { pointValue: 20, unlockCondition: () => player.fifthOwnedCoin >= 200, group: 'fifthOwnedCoin', reward: { alchemyAutobuyer: () => 1 } },
  33: { pointValue: 25, unlockCondition: () => player.fifthOwnedCoin >= 6666, group: 'fifthOwnedCoin', reward: { accelerators: () => Math.floor(player.fifthOwnedCoin / 500) } },
  34: { pointValue: 30, unlockCondition: () => player.fifthOwnedCoin >= 17777, group: 'fifthOwnedCoin', reward: { multipliers: () => Math.floor(player.fifthOwnedCoin / 1000) } },
  35: { pointValue: 35, unlockCondition: () => player.fifthOwnedCoin >= 42777, group: 'fifthOwnedCoin', reward: { accelBoosts: () => Math.floor(player.fifthOwnedCoin / 2000) } },
  36: { pointValue: 5, unlockCondition: () => G.prestigePointGain.gte(1), group: 'prestigePointGain', reward: { offeringPrestigeTimer: () => 1 } },
  37: { pointValue: 10, unlockCondition: () => G.prestigePointGain.gte(1e6), group: 'prestigePointGain', reward: { crystalMultiplier: () => Math.max(1, Decimal.log(player.prestigePoints, Math.E)) } },
  38: { pointValue: 15, unlockCondition: () => G.prestigePointGain.gte(1e100), group: 'prestigePointGain', reward: { duplicationRuneUnlock: () => 1 } },
  39: { pointValue: 20, unlockCondition: () => G.prestigePointGain.gte('1e1000'), group: 'prestigePointGain' },
  40: { pointValue: 25, unlockCondition: () => G.prestigePointGain.gte('1e10000'), group: 'prestigePointGain' },
  41: { pointValue: 30, unlockCondition: () => G.prestigePointGain.gte('1e77777'), group: 'prestigePointGain' },
  42: { pointValue: 35, unlockCondition: () => G.prestigePointGain.gte('1e250000'), group: 'prestigePointGain' },
  43: { pointValue: 5, unlockCondition: () => G.transcendPointGain.gte(1), group: 'transcendPointGain', reward: { autoPrestigeFeature: () => 1 } },
  44: { pointValue: 10, unlockCondition: () => G.transcendPointGain.gte(1e6), group: 'transcendPointGain', reward: { prismRuneUnlock: () => 1 } },
  45: { pointValue: 15, unlockCondition: () => G.transcendPointGain.gte(1e50), group: 'transcendPointGain', reward: { taxReduction: () => 0.95 } },
  46: { pointValue: 20, unlockCondition: () => G.transcendPointGain.gte(1e308), group: 'transcendPointGain', reward: { taxReduction: () => 0.95 } },
  47: { pointValue: 25, unlockCondition: () => G.transcendPointGain.gte('1e1500'), group: 'transcendPointGain', reward: { taxReduction: () => 0.9 } },
  48: { pointValue: 30, unlockCondition: () => G.transcendPointGain.gte('1e25000'), group: 'transcendPointGain' },
  49: { pointValue: 35, unlockCondition: () => G.transcendPointGain.gte('1e100000'), group: 'transcendPointGain' },
  50: { pointValue: 5, unlockCondition: () => G.reincarnationPointGain.gte(1), group: 'reincarnationPointGain', reward: { particleGain: () => 2 } },
  51: { pointValue: 10, unlockCondition: () => G.reincarnationPointGain.gte(1e5), group: 'reincarnationPointGain' },
  52: { pointValue: 15, unlockCondition: () => G.reincarnationPointGain.gte(1e30), group: 'reincarnationPointGain' },
  53: { pointValue: 20, unlockCondition: () => G.reincarnationPointGain.gte(1e200), group: 'reincarnationPointGain', reward: { multiplicativeObtainium: () => 1/800 * sumOfRuneLevels() } },
  54: { pointValue: 25, unlockCondition: () => G.reincarnationPointGain.gte('1e1500'), group: 'reincarnationPointGain' },
  55: { pointValue: 30, unlockCondition: () => G.reincarnationPointGain.gte('1e5000'), group: 'reincarnationPointGain' },
  56: { pointValue: 35, unlockCondition: () => G.reincarnationPointGain.gte('1e7777'), group: 'reincarnationPointGain' },
  57: { pointValue: 5, unlockCondition: () => player.prestigenomultiplier, group: 'ungrouped', reward: { multipliers: () => 1 } },
  58: { pointValue: 10, unlockCondition: () => player.transcendnomultiplier, group: 'ungrouped', reward: { multipliers: () => 2 } },
  59: { pointValue: 15, unlockCondition: () => player.reincarnatenomultiplier, group: 'ungrouped', reward: { multipliers: () => 4 } },
  60: { pointValue: 20, unlockCondition: () => player.prestigenoaccelerator, group: 'ungrouped', reward: { accelerators: () => 2 } },
  61: { pointValue: 25, unlockCondition: () => player.transcendnoaccelerator, group: 'ungrouped', reward: { accelerators: () => 4 } },
  62: { pointValue: 30, unlockCondition: () => player.reincarnatenoaccelerator, group: 'ungrouped', reward: { accelerators: () => 8 } },
  63: { pointValue: 35, unlockCondition: () => { return player.coinsThisTranscension.gte("1e120000") && player.acceleratorBought === 0 && player.acceleratorBoostBought === 0}, group: 'ungrouped'},
  64: { pointValue: 5, unlockCondition: () => player.prestigenocoinupgrades, group: 'ungrouped'},
  65: { pointValue: 10, unlockCondition: () => player.transcendnocoinupgrades, group: 'ungrouped'},
  66: { pointValue: 15, unlockCondition: () => player.transcendnocoinorprestigeupgrades, group: 'ungrouped'},
  67: { pointValue: 15, unlockCondition: () => player.reincarnatenocoinupgrades, group: 'ungrouped'},
  68: { pointValue: 20, unlockCondition: () => player.reincarnatenocoinorprestigeupgrades, group: 'ungrouped'},
  69: { pointValue: 30, unlockCondition: () => player.reincarnatenocoinprestigeortranscendupgrades, group: 'ungrouped'},
  70: { pointValue: 40, unlockCondition: () => player.reincarnatenocoinprestigetranscendorgeneratorupgrades, group: 'ungrouped'},
  71: { pointValue: 10, unlockCondition: () => { return sumContents(player.upgrades.slice(101, 106)) === 1 && player.upgrades[102] === 1 }, group: 'ungrouped', reward: { conversionExponent: () => 0.01 } },
  72: { pointValue: 10, unlockCondition: () => { return sumContents(player.upgrades.slice(101, 106)) === 1 && player.upgrades[103] === 1 }, group: 'ungrouped', reward: { conversionExponent: () => 0.01 } },
  73: { pointValue: 15, unlockCondition: () => { return sumContents(player.upgrades.slice(101, 106)) === 1 && player.upgrades[104] === 1 }, group: 'ungrouped', reward: { conversionExponent: () => 0.01 } },
  74: { pointValue: 20, unlockCondition: () => { return sumContents(player.upgrades.slice(101, 106)) === 1 && player.upgrades[105] === 1 }, group: 'ungrouped', reward: { conversionExponent: () => 0.01 } },
  75: { pointValue: 25, unlockCondition: () => { return player.currentChallenge.transcension === 1 && player.coinsThisTranscension.gte('1e1000') && sumContents(player.upgrades.slice(101,106)) === 0 }, group: 'ungrouped', reward: { conversionExponent: () => 0.01 } },
  76: { pointValue: 25, unlockCondition: () => { return player.currentChallenge.transcension === 2 && player.coinsThisTranscension.gte('1e1000') && sumContents(player.upgrades.slice(101,106)) === 0 }, group: 'ungrouped', reward: { conversionExponent: () => 0.01 } },
  77: { pointValue: 50, unlockCondition: () => { return player.currentChallenge.transcension === 3 && player.coinsThisTranscension.gte('1e99999') && sumContents(player.upgrades.slice(101,106)) === 0 }, group: 'ungrouped', reward: { conversionExponent: () => 0.01 } },
  78: { pointValue: 5, unlockCondition: () => player.challengecompletions[1] >= 1, group: 'challenge1', reward: { refineryAutobuy: () => 1 } },
  79: { pointValue: 10, unlockCondition: () => player.challengecompletions[1] >= 3, group: 'challenge1', reward: { crystalUpgrade1Autobuy: () => 1 } },
  80: { pointValue: 15, unlockCondition: () => player.challengecompletions[1] >= 5, group: 'challenge1', reward: { recycleChance: () => 0.05 } },
  81: { pointValue: 20, unlockCondition: () => player.challengecompletions[1] >= 10, group: 'challenge1' },
  82: { pointValue: 25, unlockCondition: () => player.challengecompletions[1] >= 20, group: 'challenge1', reward: { taxReduction: () => 0.96 } },
  83: { pointValue: 30, unlockCondition: () => player.challengecompletions[1] >= 50, group: 'challenge1' },
  84: { pointValue: 35, unlockCondition: () => player.challengecompletions[1] >= 75, group: 'challenge1', reward: { multiplicativeObtainium: () => 1.05 } },
  85: { pointValue: 5, unlockCondition: () => player.challengecompletions[2] >= 1, group: 'challenge2', reward: { coalPlantAutobuy: () => 1 } },
  86: { pointValue: 10, unlockCondition: () => player.challengecompletions[2] >= 3, group: 'challenge2', reward: { crystalUpgrade2Autobuy: () => 1 } },
  87: { pointValue: 15, unlockCondition: () => player.challengecompletions[2] >= 5, group: 'challenge2', reward: { recycleChance: () => 0.05} },
  88: { pointValue: 20, unlockCondition: () => player.challengecompletions[2] >= 10, group: 'challenge2' },
  89: { pointValue: 25, unlockCondition: () => player.challengecompletions[2] >= 20, group: 'challenge2', reward: { taxReduction: () => 0.96 } },
  90: { pointValue: 30, unlockCondition: () => player.challengecompletions[2] >= 50, group: 'challenge2' },
  91: { pointValue: 35, unlockCondition: () => player.challengecompletions[2] >= 75, group: 'challenge2', reward: { multiplicativeObtainium: () => 1.05 } },
  92: { pointValue: 5, unlockCondition: () => player.challengecompletions[3] >= 1, group: 'challenge3', reward: { coalRigAutobuy: () => 1 } },
  93: { pointValue: 10, unlockCondition: () => player.challengecompletions[3] >= 3, group: 'challenge3', reward: { crystalUpgrade3Autobuy: () => 1 } },
  94: { pointValue: 15, unlockCondition: () => player.challengecompletions[3] >= 5, group: 'challenge3', reward: { recycleChance: () => 0.05} },
  95: { pointValue: 20, unlockCondition: () => player.challengecompletions[3] >= 10, group: 'challenge3' },
  96: { pointValue: 25, unlockCondition: () => player.challengecompletions[3] >= 20, group: 'challenge3', reward: { taxReduction: () => 0.96 } },
  97: { pointValue: 30, unlockCondition: () => player.challengecompletions[3] >= 50, group: 'challenge3' },
  98: { pointValue: 35, unlockCondition: () => player.challengecompletions[3] >= 75, group: 'challenge3', reward: { multiplicativeObtainium: () => 1.05 } },
  99: { pointValue: 5, unlockCondition: () => player.challengecompletions[4] >= 1, group: 'challenge4', reward: { pickaxeAutobuy: () => 1 } },
  100: { pointValue: 10, unlockCondition: () => player.challengecompletions[4] >= 3, group: 'challenge4', reward: { crystalUpgrade4Autobuy: () => 1 } },
  101: { pointValue: 15, unlockCondition: () => player.challengecompletions[4] >= 5, group: 'challenge4', reward: { recycleChance: () => 0.05} },
  102: { pointValue: 20, unlockCondition: () => player.challengecompletions[4] >= 10, group: 'challenge4' },
  103: { pointValue: 25, unlockCondition: () => player.challengecompletions[4] >= 20, group: 'challenge4', reward: { taxReduction: () => 0.96 } },
  104: { pointValue: 30, unlockCondition: () => player.challengecompletions[4] >= 50, group: 'challenge4' },
  105: { pointValue: 35, unlockCondition: () => player.challengecompletions[4] >= 75, group: 'challenge4', reward: { multiplicativeObtainium: () => 1.05 } },
  106: { pointValue: 5, unlockCondition: () => player.challengecompletions[5] >= 1, group: 'challenge5', reward: { pandorasBoxAutobuy: () => 1 } },
  107: { pointValue: 10, unlockCondition: () => player.challengecompletions[5] >= 3, group: 'challenge5', reward: { crystalUpgrade5Autobuy: () => 1 } },
  108: { pointValue: 15, unlockCondition: () => player.challengecompletions[5] >= 5, group: 'challenge5', reward: { recycleChance: () => 0.05} },
  109: { pointValue: 20, unlockCondition: () => player.challengecompletions[5] >= 10, group: 'challenge5' },
  110: { pointValue: 25, unlockCondition: () => player.challengecompletions[5] >= 20, group: 'challenge5', reward: { taxReduction: () => 0.96 } },
  111: { pointValue: 30, unlockCondition: () => player.challengecompletions[5] >= 50, group: 'challenge5' },
  112: { pointValue: 35, unlockCondition: () => player.challengecompletions[5] >= 75, group: 'challenge5', reward: { multiplicativeObtainium: () => 1.05 } },
  113: { pointValue: 5, unlockCondition: () => player.challengecompletions[6] >= 1, group: 'challenge6' },
  114: { pointValue: 10, unlockCondition: () => player.challengecompletions[6] >= 2, group: 'challenge6' },
  115: { pointValue: 15, unlockCondition: () => player.challengecompletions[6] >= 3, group: 'challenge6', reward: { recycleChance: () => 0.05 } },
  116: { pointValue: 20, unlockCondition: () => player.challengecompletions[6] >= 5, group: 'challenge6' },
  117: { pointValue: 25, unlockCondition: () => player.challengecompletions[6] >= 10, group: 'challenge6', reward: { taxReduction: () => 0.95 } },
  118: { pointValue: 30, unlockCondition: () => player.challengecompletions[6] >= 15, group: 'challenge6', reward: { taxReduction: () => Math.pow(0.9925, player.challengecompletions[6] + player.challengecompletions[7] + player.challengecompletions[8] + player.challengecompletions[9] + player.challengecompletions[10])} },
  119: { pointValue: 35, unlockCondition: () => player.challengecompletions[6] >= 25, group: 'challenge6', reward: { exemptionTalisman: () => 0} },
  120: { pointValue: 5, unlockCondition: () => player.challengecompletions[7] >= 1, group: 'challenge7' },
  121: { pointValue: 10, unlockCondition: () => player.challengecompletions[7] >= 2, group: 'challenge7' },
  122: { pointValue: 15, unlockCondition: () => player.challengecompletions[7] >= 3, group: 'challenge7', reward: { recycleChance: () => 0.075 } },
  123: { pointValue: 20, unlockCondition: () => player.challengecompletions[7] >= 5, group: 'challenge7' },
  124: { pointValue: 25, unlockCondition: () => player.challengecompletions[7] >= 10, group: 'challenge7', reward: { taxReduction: () => 0.95, chal7Researches: () => 1} },
  125: { pointValue: 30, unlockCondition: () => player.challengecompletions[7] >= 15, group: 'challenge7', reward: { multiplicativeObtainium: () => 1.05 } },
  126: { pointValue: 35, unlockCondition: () => player.challengecompletions[7] >= 25, group: 'challenge7', reward: { chronosTalisman: () => 1 } },
  127: { pointValue: 5, unlockCondition: () => player.challengecompletions[8] >= 1, group: 'challenge8', reward: { chal8Researches: () => 1 } },
  128: { pointValue: 10, unlockCondition: () => player.challengecompletions[8] >= 2, group: 'challenge8' },
  129: { pointValue: 15, unlockCondition: () => player.challengecompletions[8] >= 3, group: 'challenge8', reward: { recycleChance: () => 0.075 } },
  130: { pointValue: 20, unlockCondition: () => player.challengecompletions[8] >= 5, group: 'challenge8' },
  131: { pointValue: 25, unlockCondition: () => player.challengecompletions[8] >= 10, group: 'challenge8', reward: { taxReduction: () => 0.95 } },
  132: { pointValue: 30, unlockCondition: () => player.challengecompletions[8] >= 15, group: 'challenge8', reward: { multiplicativeObtainium: () => 1.05 } },
  133: { pointValue: 35, unlockCondition: () => player.challengecompletions[8] >= 25, group: 'challenge8', reward: { midasTalisman: () => 1 } },
  134: { pointValue: 5, unlockCondition: () => player.challengecompletions[9] >= 1, group: 'challenge9', reward: { chal9Researches: () => 1 } },
  135: { pointValue: 10, unlockCondition: () => player.challengecompletions[9] >= 2, group: 'challenge9', reward: { talismanPower: () => 0.02 } },
  136: { pointValue: 15, unlockCondition: () => player.challengecompletions[9] >= 3, group: 'challenge9', reward: { talismanPower: () => 0.02 } },
  137: { pointValue: 20, unlockCondition: () => player.challengecompletions[9] >= 5, group: 'challenge9', reward: { sacrificeMult: () => 1.25 } },
  138: { pointValue: 25, unlockCondition: () => player.challengecompletions[9] >= 10, group: 'challenge9' },
  139: { pointValue: 30, unlockCondition: () => player.challengecompletions[9] >= 15, group: 'challenge9', reward: { multiplicativeObtainium: () => 1.05} },
  140: { pointValue: 35, unlockCondition: () => player.challengecompletions[9] >= 25, group: 'challenge9', reward: { metaphysicsTalisman: () => 1 } },
  141: { pointValue: 5, unlockCondition: () => player.challengecompletions[10] >= 1, group: 'challenge10', reward: { ascensionUnlock: () => 1 } },
  142: { pointValue: 10, unlockCondition: () => player.challengecompletions[10] >= 2, group: 'challenge10' },
  143: { pointValue: 15, unlockCondition: () => player.challengecompletions[10] >= 3, group: 'challenge10' },
  144: { pointValue: 20, unlockCondition: () => player.challengecompletions[10] >= 5, group: 'challenge10', reward: { talismanPower: () => 0.025 } },
  145: { pointValue: 25, unlockCondition: () => player.challengecompletions[10] >= 10, group: 'challenge10', reward: { talismanPower: () => 0.025 } },
  146: { pointValue: 30, unlockCondition: () => player.challengecompletions[10] >= 15, group: 'challenge10', reward: { multiplicativeObtainium: () => 1.05 } },
  147: { pointValue: 35, unlockCondition: () => player.challengecompletions[10] >= 25, group: 'challenge10', reward: { polymathTalisman: () => 1 } },
  148: { pointValue: 5, unlockCondition: () => player.acceleratorBought >= 5, group: 'accelerators' },
  149: { pointValue: 10, unlockCondition: () => player.acceleratorBought >= 25, group: 'accelerators', reward: { acceleratorPower: () => 0.01 } },
  150: { pointValue: 15, unlockCondition: () => player.acceleratorBought >= 100, group: 'accelerators' },
  151: { pointValue: 20, unlockCondition: () => player.acceleratorBought >= 666, group: 'accelerators', reward: { accelerators: () => 5 } },
  152: { pointValue: 25, unlockCondition: () => player.acceleratorBought >= 2000, group: 'accelerators', reward: { accelerators: () => 12 } },
  153: { pointValue: 30, unlockCondition: () => player.acceleratorBought >= 12500, group: 'accelerators', reward: { accelerators: () => 25 } },
  154: { pointValue: 35, unlockCondition: () => player.acceleratorBought >= 100000, group: 'accelerators', reward: { accelerators: () => 50 } },
  155: { pointValue: 5, unlockCondition: () => player.multiplierBought >= 2, group: 'multipliers' },
  156: { pointValue: 10, unlockCondition: () => player.multiplierBought >= 20, group: 'multipliers', reward: { multipliers: () => 1 } },
  157: { pointValue: 15, unlockCondition: () => player.multiplierBought >= 100, group: 'multipliers' },
  158: { pointValue: 20, unlockCondition: () => player.multiplierBought >= 500, group: 'multipliers', reward: { multipliers: () => 1 } },
  159: { pointValue: 25, unlockCondition: () => player.multiplierBought >= 2000, group: 'multipliers', reward: { multipliers: () => 3 } },
  160: { pointValue: 30, unlockCondition: () => player.multiplierBought >= 12500, group: 'multipliers', reward: { multipliers: () => 6 } },
  161: { pointValue: 35, unlockCondition: () => player.multiplierBought >= 100000, group: 'multipliers', reward: { multipliers: () => 10 } },
  162: { pointValue: 5, unlockCondition: () => player.acceleratorBoostBought >= 2, group: 'acceleratorBoosts' },
  163: { pointValue: 10, unlockCondition: () => player.acceleratorBoostBought >= 10, group: 'acceleratorBoosts' },
  164: { pointValue: 15, unlockCondition: () => player.acceleratorBoostBought >= 50, group: 'acceleratorBoosts' },
  165: { pointValue: 20, unlockCondition: () => player.acceleratorBoostBought >= 200, group: 'acceleratorBoosts' },
  166: { pointValue: 25, unlockCondition: () => player.acceleratorBoostBought >= 1000, group: 'acceleratorBoosts' },
  167: { pointValue: 30, unlockCondition: () => player.acceleratorBoostBought >= 5000, group: 'acceleratorBoosts' },
  168: { pointValue: 35, unlockCondition: () => player.acceleratorBoostBought >= 15000, group: 'acceleratorBoosts' },
  169: { pointValue: 5, unlockCondition: () => player.antPoints.gte(3), group: 'antCrumbs', reward: { antSpeed: () => Decimal.log(player.antPoints.plus(10), 10) } },
  170: { pointValue: 10, unlockCondition: () => player.antPoints.gte(1e5), group: 'antCrumbs' },
  171: { pointValue: 15, unlockCondition: () => player.antPoints.gte(666666666), group: 'antCrumbs', reward: { antSpeed: () => 1.2 } },
  172: { pointValue: 20, unlockCondition: () => player.antPoints.gte(1e20), group: 'antCrumbs', reward: { antSpeed: () => 1.25 } },
  173: { pointValue: 25, unlockCondition: () => player.antPoints.gte(1e40), group: 'antCrumbs', reward: { antSpeed: () => 1.4, antSacrificeUnlock: () => 1, antAutobuyers: () => 1 } },
  174: { pointValue: 30, unlockCondition: () => player.antPoints.gte('1e500'), group: 'antCrumbs', reward: { antSpeed: () => 1 + Math.log10(player.antSacrificePoints + 1) } },
  175: { pointValue: 35, unlockCondition: () => player.antPoints.gte('1e2500'), group: 'antCrumbs' },
  176: { pointValue: 5, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 2, group: 'sacMult', reward: { antAutobuyers: () => 1, antUpgradeAutobuyers: () => 2, antELOAdditive: () => 25 } },
  177: { pointValue: 10, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 6, group: 'sacMult', reward: { antAutobuyers: () => 1, antUpgradeAutobuyers: () => 1, antELOAdditive: () => 50 } },
  178: { pointValue: 15, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 20, group: 'sacMult', reward: { antAutobuyers: () => 1, antUpgradeAutobuyers: () => 2, antELOAdditive: () => 75 } },
  179: { pointValue: 20, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 100, group: 'sacMult', reward: { antAutobuyers: () => 1, antUpgradeAutobuyers: () => 1, antELOAdditive: () => 100 } },
  180: { pointValue: 25, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 500, group: 'sacMult', reward: { antAutobuyers: () => 1, antUpgradeAutobuyers: () => 2, antELOMultiplicative: () => 1.01 } },
  181: { pointValue: 30, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 6666, group: 'sacMult', reward: { antAutobuyers: () => 1, antUpgradeAutobuyers: () => 1, antELOMultiplicative: () => 1.02 } },
  182: { pointValue: 35, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 77777, group: 'sacMult', reward: { antAutobuyers: () => 1, antUpgradeAutobuyers: () => 2, antELOMultiplicative: () => 1.03 } },
  183: { pointValue: 5, unlockCondition: () => player.ascensionCount >= 1, group: 'ascensionCount' },
  184: { pointValue: 10, unlockCondition: () => player.ascensionCount >= 2, group: 'ascensionCount' },
  185: { pointValue: 15, unlockCondition: () => player.ascensionCount >= 10, group: 'ascensionCount' },
  186: { pointValue: 20, unlockCondition: () => player.ascensionCount >= 100, group: 'ascensionCount', reward: { wowSquareTalisman: () => 1 } },
  187: { pointValue: 25, unlockCondition: () => player.ascensionCount >= 1000, group: 'ascensionCount', reward: { ascensionCountMultiplier: () => 2, multiplicativeOffering: () => 1 + Math.min(1, player.ascensionCount / 1e6) } },
  188: { pointValue: 30, unlockCondition: () => player.ascensionCount >= 14142, group: 'ascensionCount', reward: { ascensionCountAdditive: () => (player.ascensionCounter > 10) ? 100 : 0, multiplicativeObtainium: () => 1 + Math.min(1, player.ascensionCount / 5e6) } },
  189: { pointValue: 35, unlockCondition: () => player.ascensionCount >= 141421, group: 'ascensionCount', reward: { ascensionCountAdditive: () => (player.ascensionCounter > 10) ? player.ascensionCounterReal * 2 : 0, wowCubeGain: () => 1 + 2 * Math.min(1, player.ascensionCount / 5e8) } },
  190: { pointValue: 5, unlockCondition: () => player.ascendShards.gte(3.14), group: 'constant' },
  191: { pointValue: 10, unlockCondition: () => player.ascendShards.gte(1e6), group: 'constant' },
  192: { pointValue: 15, unlockCondition: () => player.ascendShards.gte(4.32e10), group: 'constant' },
  193: { pointValue: 20, unlockCondition: () => player.ascendShards.gte(6.9e21), group: 'constant', reward: { wowCubeGain: () => 1 + Decimal.log(player.ascendShards.add(1), 10)/ 400  } },
  194: { pointValue: 25, unlockCondition: () => player.ascendShards.gte(1.509e33), group: 'constant' },
  195: { pointValue: 30, unlockCondition: () => player.ascendShards.gte(1e66), group: 'constant', reward: { wowCubeGain: () => 1 + 249 * Math.min(1, Decimal.log(player.ascendShards.plus(1), 10) / 100000), wowTesseractGain: () =>  1 + 249 * Math.min(1, Decimal.log(player.ascendShards.plus(1), 10) / 100000) } },
  196: { pointValue: 35, unlockCondition: () => player.ascendShards.gte('1.8e308'), group: 'constant', reward: { wowPlatonicGain: () => 1 + 19 * Math.min(1, Decimal.log(player.ascendShards.plus(1), 10) / 100000) } },
  197: { pointValue: 10, unlockCondition: () => player.challengecompletions[11] >= 1, group: 'challenge11', reward: { statTracker: () => 1 } },
  198: { pointValue: 20, unlockCondition: () => player.challengecompletions[11] >= 2, group: 'challenge11', reward: { wowCubeGain: () => 1.02 } },
  199: { pointValue: 30, unlockCondition: () => player.challengecompletions[11] >= 3, group: 'challenge11', reward: { wowCubeGain: () => 1.02 } },
  200: { pointValue: 40, unlockCondition: () => player.challengecompletions[11] >= 5, group: 'challenge11', reward: { wowCubeGain: () => 1.02 } },
  201: { pointValue: 50, unlockCondition: () => player.challengecompletions[11] >= 10, group: 'challenge11', reward: { wowCubeGain: () => 1.02 } },
  202: { pointValue: 60, unlockCondition: () => player.challengecompletions[11] >= 20, group: 'challenge11', reward: { ascensionCountAdditive: () => player.ascensionCounter * 2} },
  203: { pointValue: 70, unlockCondition: () => player.challengecompletions[11] >= 30, group: 'challenge11', reward: { talismanPower: () => 0.01 } },
  204: { pointValue: 10, unlockCondition: () => player.challengecompletions[12] >= 1, group: 'challenge12', reward: { ascensionRewardScaling: () => 1 } },
  205: { pointValue: 20, unlockCondition: () => player.challengecompletions[12] >= 2, group: 'challenge12', reward: { wowTesseractGain: () => 1.02 } },
  206: { pointValue: 30, unlockCondition: () => player.challengecompletions[12] >= 3, group: 'challenge12', reward: { wowTesseractGain: () => 1.02 } },
  207: { pointValue: 40, unlockCondition: () => player.challengecompletions[12] >= 5, group: 'challenge12', reward: { wowTesseractGain: () => 1.02 } },
  208: { pointValue: 50, unlockCondition: () => player.challengecompletions[12] >= 10, group: 'challenge12', reward: { wowTesseractGain: () => 1.02 } },
  209: { pointValue: 60, unlockCondition: () => player.challengecompletions[12] >= 20, group: 'challenge12', reward: { ascensionCountAdditive: () => player.ascensionCounter * 2 } },
  210: { pointValue: 70, unlockCondition: () => player.challengecompletions[12] >= 30, group: 'challenge12', reward: { talismanPower: () => 0.01 } },
  211: { pointValue: 10, unlockCondition: () => player.challengecompletions[13] >= 1, group: 'challenge13', reward: { wowHypercubeGain: () => 1.05 } },
  212: { pointValue: 20, unlockCondition: () => player.challengecompletions[13] >= 2, group: 'challenge13', reward: { wowHypercubeGain: () => 1.02 } },
  213: { pointValue: 30, unlockCondition: () => player.challengecompletions[13] >= 3, group: 'challenge13', reward: { wowHypercubeGain: () => 1.02 } },
  214: { pointValue: 40, unlockCondition: () => player.challengecompletions[13] >= 5, group: 'challenge13', reward: { wowHypercubeGain: () => 1.02 } },
  215: { pointValue: 50, unlockCondition: () => player.challengecompletions[13] >= 10, group: 'challenge13', reward: { wowHypercubeGain: () => 1.02 } },
  216: { pointValue: 60, unlockCondition: () => player.challengecompletions[13] >= 20, group: 'challenge13', reward: { ascensionCountAdditive: () => player.ascensionCounter * 2 } },
  217: { pointValue: 70, unlockCondition: () => player.challengecompletions[13] >= 30, group: 'challenge13', reward: { talismanPower: () => 0.01 } },
  218: { pointValue: 10, unlockCondition: () => player.challengecompletions[14] >= 1, group: 'challenge14', reward: { wowPlatonicGain: () => 1.05 } },
  219: { pointValue: 20, unlockCondition: () => player.challengecompletions[14] >= 2, group: 'challenge14', reward: { wowPlatonicGain: () => 1.02 } },
  220: { pointValue: 30, unlockCondition: () => player.challengecompletions[14] >= 3, group: 'challenge14', reward: { wowPlatonicGain: () => 1.02 } },
  221: { pointValue: 40, unlockCondition: () => player.challengecompletions[14] >= 5, group: 'challenge14', reward: { wowPlatonicGain: () => 1.02 } },
  222: { pointValue: 50, unlockCondition: () => player.challengecompletions[14] >= 10, group: 'challenge14', reward: { wowPlatonicGain: () => 1.02 } },
  223: { pointValue: 60, unlockCondition: () => player.challengecompletions[14] >= 20, group: 'challenge14', reward: { ascensionCountAdditive: () => player.ascensionCounter * 2, wowPlatonicGain: () => 1 + 2 * Math.min(1, player.ascensionCount / 2.674e9) } },
  224: { pointValue: 70, unlockCondition: () => player.challengecompletions[14] >= 30, group: 'challenge14' },
  225: { pointValue: 5, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e5, group: 'ascensionScore'},
  226: { pointValue: 10, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e6, group: 'ascensionScore'},
  227: { pointValue: 15, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e7, group: 'ascensionScore'},
  228: { pointValue: 20, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e8, group: 'ascensionScore'},
  229: { pointValue: 25, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e9, group: 'ascensionScore'},
  230: { pointValue: 30, unlockCondition: () => CalcCorruptionStuff()[3] >= 5e9, group: 'ascensionScore'},
  231: { pointValue: 35, unlockCondition: () => CalcCorruptionStuff()[3] >= 2.5e10, group: 'ascensionScore'},
  232: { pointValue: 10, unlockCondition: () => getRuneBlessing('speed').level >= 100, group: 'speedBlessing'},
  233: { pointValue: 20, unlockCondition: () => getRuneBlessing('speed').level >= 250, group: 'speedBlessing'},
  234: { pointValue: 30, unlockCondition: () => getRuneBlessing('speed').level >= 500, group: 'speedBlessing'},
  235: { pointValue: 10, unlockCondition: () => getRuneSpirit('speed').level >= 100, group: 'speedSpirit'},
  236: { pointValue: 20, unlockCondition: () => getRuneSpirit('speed').level >= 250, group: 'speedSpirit'},
  237: { pointValue: 30, unlockCondition: () => getRuneSpirit('speed').level >= 500, group: 'speedSpirit'},
  238: { pointValue: 50, unlockCondition: () => { return player.currentChallenge.transcension !== 0 && player.currentChallenge.reincarnation !== 0 && player.currentChallenge.ascension !== 0 }, group: 'ungrouped' },
  239: { pointValue: 50, unlockCondition: () => player.mythicalFragments >= 1e25, group: 'ungrouped' },
  240: { pointValue: 50, unlockCondition: () => player.ascensionCount >= 1414213, group: 'ungrouped', reward: { allCubeGain: () => 1.2 } },
  // 241: Global speed is SLOW
  241: { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
  // 242: Global speed is FAST
  242: { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
  // 243: :unsmith:
  243: { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
  // 244: :smith:
  244: { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
  // 245: High Speed Blessing
  245: { pointValue: 50, unlockCondition: () => getRuneBlessing('speed').level >= 2222, group: 'speedBlessing'},
  // 246: Open 1 cube with a ton of cube tributes already
  246: { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
  // 247: Extra challenging
  247: { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
  // 248: Seeing Red But Not Blue
  248: { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
  // 249: Overtaxed
  249: { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
  // 250: Thousand Suns
  250: { pointValue: 100, unlockCondition: () => player.researches[200] === 1e5, group: 'ungrouped', reward: { allCubeGain: () => 1.05, multiplicativeObtainium: () => 1.1, multiplicativeOffering: () => 1.5, quarkGain: () => 1.05 } },
  // 251: Thousand Moons
  251: { pointValue: 150, unlockCondition: () => player.cubeUpgrades[50] === 1e5, group: 'ungrouped', reward: { allCubeGain: () => 1.05, multiplicativeObtainium: () => 1.5, multiplicativeOffering: () => 1.1, quarkGain: () => 1.05 } },
  // 252: Sadistic II
  252: { pointValue: 50, unlockCondition: () => G.challenge15Rewards.achievementUnlock.value === 1, group: 'ungrouped'},
  253: { pointValue: 40, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e12, group: 'ascensionScore', reward: { wowHypercubeGain: () => 1.1 }},
  254: { pointValue: 45, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e14, group: 'ascensionScore', reward: { wowCubeGain: () => 1.1 }},
  255: { pointValue: 50, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e17, group: 'ascensionScore', reward: { wowTesseractGain: () => 1.1 }},
  256: { pointValue: 55, unlockCondition: () => CalcCorruptionStuff()[3] >= 2e18, group: 'ascensionScore', reward: { wowPlatonicGain: () => 1.1 }},
  257: { pointValue: 60, unlockCondition: () => CalcCorruptionStuff()[3] >= 4e19, group: 'ascensionScore', reward: { allCubeGain: () => 1.1 }},
  258: { pointValue: 65, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e21, group: 'ascensionScore', reward: { wowHepteractGain: () => 1.1 } },
  259: { pointValue: 70, unlockCondition: () => CalcCorruptionStuff()[3] >= 1e23, group: 'ascensionScore', reward: { ascensionScore: () => Math.pow(1.01, getHepteract('abyss').TIMES_CAP_EXTENDED) }},
  260: { pointValue: 40, unlockCondition: () => player.ascensionCount >= 1e7, group: 'ascensionCount', reward: { ascensionCountMultiplier: () => 1.1 } },
  261: { pointValue: 45, unlockCondition: () => player.ascensionCount >= 1e8, group: 'ascensionCount', reward: { ascensionCountMultiplier: () => 1.1 } },
  262: { pointValue: 50, unlockCondition: () => player.ascensionCount >= 2e9, group: 'ascensionCount', reward: { allCubeGain: () => 1.1 } },
  263: { pointValue: 55, unlockCondition: () => player.ascensionCount >= 4e10, group: 'ascensionCount', reward: { allCubeGain: () => 1.1 } },
  264: { pointValue: 60, unlockCondition: () => player.ascensionCount >= 8e11, group: 'ascensionCount', reward: { allCubeGain: () => 1 + 0.2 * Math.min(player.ascensionCount / 8e12, 1) } },
  265: { pointValue: 65, unlockCondition: () => player.ascensionCount >= 1.6e13, group: 'ascensionCount', reward: { allCubeGain: () => 1 + 0.2 * Math.min(player.ascensionCount / 1.6e14, 1) } },
  266: { pointValue: 70, unlockCondition: () => player.ascensionCount >= 1e14, group: 'ascensionCount', reward: { quarkGain: () => 1 + 0.1 * Math.min(player.ascensionCount / 1e15, 1) } },
  267: { pointValue: 40, unlockCondition: () => player.ascendShards.gte('1e1000'), group: 'constant', reward: { ascensionScore: () => 1 + Math.min(Decimal.log(player.ascendShards.add(1), 10) / 1e5, 1) } },
  268: { pointValue: 45, unlockCondition: () => player.ascendShards.gte('1e5000'), group: 'constant' },
  269: { pointValue: 50, unlockCondition: () => player.ascendShards.gte('1e15000'), group: 'constant' },
  270: { pointValue: 55, unlockCondition: () => player.ascendShards.gte('1e50000'), group: 'constant', reward: { wowHepteractGain: () => 1 + Math.min(Decimal.log(player.ascendShards.add(1), 10) / 1e6, 1), constUpgrade1Buff: () => 0.01, constUpgrade2Buff: () => 0.01 } },
  271: { pointValue: 60, unlockCondition: () => player.ascendShards.gte('1e100000'), group: 'constant', reward: { platonicToHypercubes: () => Math.min(1, Decimal.log(player.ascendShards.add(1), 10) / 1e6) } },
  272: { pointValue: 65, unlockCondition: () => player.ascendShards.gte('1e300000'), group: 'constant' },
  273: { pointValue: 70, unlockCondition: () => player.ascendShards.gte('1e1000000'), group: 'constant' },
  274: { pointValue: 10, unlockCondition: () => player.highestSingularityCount >= 1, group: 'singularityCount' },
  275: { pointValue: 20, unlockCondition: () => player.highestSingularityCount >= 2, group: 'singularityCount' },
  276: { pointValue: 30, unlockCondition: () => player.highestSingularityCount >= 3, group: 'singularityCount' },
  277: { pointValue: 40, unlockCondition: () => player.highestSingularityCount >= 4, group: 'singularityCount' },
  278: { pointValue: 50, unlockCondition: () => player.highestSingularityCount >= 5, group: 'singularityCount' },
  279: { pointValue: 60, unlockCondition: () => player.highestSingularityCount >= 7, group: 'singularityCount' },
  280: { pointValue: 70, unlockCondition: () => player.highestSingularityCount >= 10, group: 'singularityCount' },
  281: { pointValue: 40, unlockCondition: () => player.firstOwnedCoin >= 1e5, group: 'firstOwnedCoin'},
  282: { pointValue: 45, unlockCondition: () => player.firstOwnedCoin >= 1e6, group: 'firstOwnedCoin'},
  283: { pointValue: 50, unlockCondition: () => player.firstOwnedCoin >= 1e8, group: 'firstOwnedCoin'},
  284: { pointValue: 40, unlockCondition: () => player.secondOwnedCoin >= 1e6, group: 'secondOwnedCoin'},
  285: { pointValue: 45, unlockCondition: () => player.secondOwnedCoin >= 1e8, group: 'secondOwnedCoin'},
  286: { pointValue: 50, unlockCondition: () => player.secondOwnedCoin >= 1e9, group: 'secondOwnedCoin'},
  287: { pointValue: 40, unlockCondition: () => player.thirdOwnedCoin >= 1e7, group: 'thirdOwnedCoin'},
  288: { pointValue: 45, unlockCondition: () => player.thirdOwnedCoin >= 1e8, group: 'thirdOwnedCoin'},
  289: { pointValue: 50, unlockCondition: () => player.thirdOwnedCoin >= 5e9, group: 'thirdOwnedCoin'},
  290: { pointValue: 40, unlockCondition: () => player.fourthOwnedCoin >= 1e8, group: 'fourthOwnedCoin'},
  291: { pointValue: 45, unlockCondition: () => player.fourthOwnedCoin >= 1e9, group: 'fourthOwnedCoin'},
  292: { pointValue: 50, unlockCondition: () => player.fourthOwnedCoin >= 2e10, group: 'fourthOwnedCoin'},
  293: { pointValue: 40, unlockCondition: () => player.fifthOwnedCoin >= 1e9, group: 'fifthOwnedCoin'},
  294: { pointValue: 45, unlockCondition: () => player.fifthOwnedCoin >= 2e10, group: 'fifthOwnedCoin'},
  295: { pointValue: 50, unlockCondition: () => player.fifthOwnedCoin >= 1e12, group: 'fifthOwnedCoin'},
  296: { pointValue: 40, unlockCondition: () => G.prestigePointGain.gte('1e10000000'), group: 'prestigePointGain'},
  297: { pointValue: 45, unlockCondition: () => G.prestigePointGain.gte('1e10000000000'), group: 'prestigePointGain'},
  298: { pointValue: 50, unlockCondition: () => G.prestigePointGain.gte('1e10000000000000'), group: 'prestigePointGain'},
  299: { pointValue: 40, unlockCondition: () => G.prestigePointGain.gte('1e2500000'), group: 'transcendPointGain'},
  300: { pointValue: 45, unlockCondition: () => G.prestigePointGain.gte('1e2500000000'), group: 'transcendPointGain'},
  301: { pointValue: 50, unlockCondition: () => G.prestigePointGain.gte('1e2500000000000'), group: 'transcendPointGain'},
  302: { pointValue: 40, unlockCondition: () => G.prestigePointGain.gte('1e100000'), group: 'reincarnationPointGain'},
  303: { pointValue: 45, unlockCondition: () => G.prestigePointGain.gte('1e100000000'), group: 'reincarnationPointGain'},
  304: { pointValue: 50, unlockCondition: () => G.prestigePointGain.gte('1e100000000000'), group: 'reincarnationPointGain'},
  305: { pointValue: 40, unlockCondition: () => player.challengecompletions[1] >= 1000, group: 'challenge1' },
  306: { pointValue: 45, unlockCondition: () => player.challengecompletions[1] >= 9000, group: 'challenge1' },
  307: { pointValue: 50, unlockCondition: () => player.challengecompletions[1] >= 9001, group: 'challenge1' },
  308: { pointValue: 40, unlockCondition: () => player.challengecompletions[2] >= 1000, group: 'challenge2' },
  309: { pointValue: 45, unlockCondition: () => player.challengecompletions[2] >= 9000, group: 'challenge2' },
  310: { pointValue: 50, unlockCondition: () => player.challengecompletions[2] >= 9001, group: 'challenge2' },
  311: { pointValue: 40, unlockCondition: () => player.challengecompletions[3] >= 1000, group: 'challenge3' },
  312: { pointValue: 45, unlockCondition: () => player.challengecompletions[3] >= 9000, group: 'challenge3' },
  313: { pointValue: 50, unlockCondition: () => player.challengecompletions[3] >= 9001, group: 'challenge3' },
  314: { pointValue: 40, unlockCondition: () => player.challengecompletions[4] >= 1000, group: 'challenge4' },
  315: { pointValue: 45, unlockCondition: () => player.challengecompletions[4] >= 9000, group: 'challenge4' },
  316: { pointValue: 50, unlockCondition: () => player.challengecompletions[4] >= 9001, group: 'challenge4' },
  317: { pointValue: 40, unlockCondition: () => player.challengecompletions[5] >= 1000, group: 'challenge5' },
  318: { pointValue: 45, unlockCondition: () => player.challengecompletions[5] >= 9000, group: 'challenge5' },
  319: { pointValue: 50, unlockCondition: () => player.challengecompletions[5] >= 9001, group: 'challenge5' },
  320: { pointValue: 40, unlockCondition: () => player.challengecompletions[6] >= 40, group: 'challenge6' },
  321: { pointValue: 45, unlockCondition: () => player.challengecompletions[6] >= 80, group: 'challenge6' },
  322: { pointValue: 50, unlockCondition: () => player.challengecompletions[6] >= 140, group: 'challenge6' },
  323: { pointValue: 40, unlockCondition: () => player.challengecompletions[7] >= 40, group: 'challenge7' },
  324: { pointValue: 45, unlockCondition: () => player.challengecompletions[7] >= 80, group: 'challenge7' },
  325: { pointValue: 50, unlockCondition: () => player.challengecompletions[7] >= 140, group: 'challenge7' },
  326: { pointValue: 40, unlockCondition: () => player.challengecompletions[8] >= 40, group: 'challenge8' },
  327: { pointValue: 45, unlockCondition: () => player.challengecompletions[8] >= 80, group: 'challenge8' },
  328: { pointValue: 50, unlockCondition: () => player.challengecompletions[8] >= 140, group: 'challenge8' },
  329: { pointValue: 40, unlockCondition: () => player.challengecompletions[9] >= 40, group: 'challenge9' },
  330: { pointValue: 45, unlockCondition: () => player.challengecompletions[9] >= 80, group: 'challenge9' },
  331: { pointValue: 50, unlockCondition: () => player.challengecompletions[9] >= 140, group: 'challenge9' },
  332: { pointValue: 40, unlockCondition: () => player.challengecompletions[10] >= 40, group: 'challenge10' },
  333: { pointValue: 45, unlockCondition: () => player.challengecompletions[10] >= 80, group: 'challenge10' },
  334: { pointValue: 50, unlockCondition: () => player.challengecompletions[10] >= 140, group: 'challenge10' },
  335: { pointValue: 40, unlockCondition: () => player.acceleratorBought >= 1e6, group: 'accelerators' },
  336: { pointValue: 45, unlockCondition: () => player.acceleratorBought >= 1e7, group: 'accelerators' },
  337: { pointValue: 50, unlockCondition: () => player.acceleratorBought >= 1e8, group: 'accelerators' },
  338: { pointValue: 40, unlockCondition: () => player.multiplierBought >= 3e6, group: 'multipliers' },
  339: { pointValue: 45, unlockCondition: () => player.multiplierBought >= 3e7, group: 'multipliers' },
  340: { pointValue: 50, unlockCondition: () => player.multiplierBought >= 3e8, group: 'multipliers' },
  341: { pointValue: 40, unlockCondition: () => player.acceleratorBoostBought >= 1e5, group: 'acceleratorBoosts' },
  342: { pointValue: 45, unlockCondition: () => player.acceleratorBoostBought >= 1e6, group: 'acceleratorBoosts' },
  343: { pointValue: 50, unlockCondition: () => player.acceleratorBoostBought >= 1e7, group: 'acceleratorBoosts' },
  344: { pointValue: 40, unlockCondition: () => player.antPoints.gte('1e25000'), group: 'antCrumbs' },
  345: { pointValue: 45, unlockCondition: () => player.antPoints.gte('1e125000'), group: 'antCrumbs' },
  346: { pointValue: 50, unlockCondition: () => player.antPoints.gte('1e1000000'), group: 'antCrumbs' },
  347: { pointValue: 40, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 9999999, group: 'sacMult' },
  348: { pointValue: 45, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 1e15, group: 'sacMult' },
  349: { pointValue: 50, unlockCondition: () => antSacrificePointsToMultiplier(player.antSacrificePoints) >= 1e100, group: 'sacMult' },
  350: { pointValue: 75, unlockCondition: () => player.ascensionCount >= 1e16, group: 'ascensionCount' },
  351: { pointValue: 80, unlockCondition: () => player.ascensionCount >= 1e20, group: 'ascensionCount' },
  352: { pointValue: 85, unlockCondition: () => player.ascensionCount >= 1e25, group: 'ascensionCount' },
  353: { pointValue: 90, unlockCondition: () => player.ascensionCount >= 1e35, group: 'ascensionCount' },
  354: { pointValue: 95, unlockCondition: () => player.ascensionCount >= 1e50, group: 'ascensionCount' },
  355: { pointValue: 100, unlockCondition: () => player.ascensionCount >= 1e75, group: 'ascensionCount' },
  356: { pointValue: 75, unlockCondition: () => player.ascendShards.gte('1e2000000'), group: 'constant' },
  357: { pointValue: 80, unlockCondition: () => player.ascendShards.gte('1e5000000'), group: 'constant' },
  358: { pointValue: 85, unlockCondition: () => player.ascendShards.gte('1e10000000'), group: 'constant' },
  359: { pointValue: 90, unlockCondition: () => player.ascendShards.gte('1e25000000'), group: 'constant' },
  360: { pointValue: 95, unlockCondition: () => player.ascendShards.gte('1e50000000'), group: 'constant' },
  361: { pointValue: 100, unlockCondition: () => player.ascendShards.gte('1e100000000'), group: 'constant' },
  362: { pointValue: 80, unlockCondition: () => player.challengecompletions[11] >= 50, group: 'challenge11' },
  363: { pointValue: 90, unlockCondition: () => player.challengecompletions[11] >= 90, group: 'challenge11' },
  364: { pointValue: 100, unlockCondition: () => player.challengecompletions[11] >= 140, group: 'challenge11' },
  365: { pointValue: 110, unlockCondition: () => player.challengecompletions[11] >= 143, group: 'challenge11' },
  366: { pointValue: 120, unlockCondition: () => player.challengecompletions[11] >= 145, group: 'challenge11' },
  367: { pointValue: 80, unlockCondition: () => player.challengecompletions[12] >= 50, group: 'challenge12' },
  368: { pointValue: 90, unlockCondition: () => player.challengecompletions[12] >= 90, group: 'challenge12' },
  369: { pointValue: 100, unlockCondition: () => player.challengecompletions[12] >= 140, group: 'challenge12' },
  370: { pointValue: 110, unlockCondition: () => player.challengecompletions[12] >= 143, group: 'challenge12' },
  371: { pointValue: 120, unlockCondition: () => player.challengecompletions[12] >= 145, group: 'challenge12' },
  372: { pointValue: 80, unlockCondition: () => player.challengecompletions[13] >= 50, group: 'challenge13' },
  373: { pointValue: 90, unlockCondition: () => player.challengecompletions[13] >= 90, group: 'challenge13' },
  374: { pointValue: 100, unlockCondition: () => player.challengecompletions[13] >= 140, group: 'challenge13' },
  375: { pointValue: 110, unlockCondition: () => player.challengecompletions[13] >= 143, group: 'challenge13' },
  376: { pointValue: 120, unlockCondition: () => player.challengecompletions[13] >= 145, group: 'challenge13' },
  377: { pointValue: 80, unlockCondition: () => player.challengecompletions[14] >= 50, group: 'challenge14' },
  378: { pointValue: 90, unlockCondition: () => player.challengecompletions[14] >= 90, group: 'challenge14' },
  379: { pointValue: 100, unlockCondition: () => player.challengecompletions[14] >= 140, group: 'challenge14' },
  380: { pointValue: 110, unlockCondition: () => player.challengecompletions[14] >= 143, group: 'challenge14' },
  381: { pointValue: 120, unlockCondition: () => player.challengecompletions[14] >= 145, group: 'challenge14' },
  382: { pointValue: 40, unlockCondition: () => getRuneBlessing('speed').level >= 1000, group: 'speedBlessing'},
  383: { pointValue: 50, unlockCondition: () => getRuneBlessing('speed').level >= 2000, group: 'speedBlessing'},
  384: { pointValue: 60, unlockCondition: () => getRuneBlessing('speed').level >= 4000, group: 'speedBlessing'},
  385: { pointValue: 70, unlockCondition: () => getRuneBlessing('speed').level >= 6000, group: 'speedBlessing'},
  386: { pointValue: 80, unlockCondition: () => getRuneBlessing('speed').level >= 8000, group: 'speedBlessing'},
  387: { pointValue: 90, unlockCondition: () => getRuneBlessing('speed').level >= 10000, group: 'speedBlessing'},
  388: { pointValue: 100, unlockCondition: () => getRuneBlessing('speed').level >= 12500, group: 'speedBlessing'},
  389: { pointValue: 40, unlockCondition: () => getRuneSpirit('speed').level >= 1000, group: 'speedSpirit'},
  390: { pointValue: 50, unlockCondition: () => getRuneSpirit('speed').level >= 2000, group: 'speedSpirit'},
  391: { pointValue: 60, unlockCondition: () => getRuneSpirit('speed').level >= 4000, group: 'speedSpirit'},
  392: { pointValue: 70, unlockCondition: () => getRuneSpirit('speed').level >= 6000, group: 'speedSpirit'},
  393: { pointValue: 80, unlockCondition: () => getRuneSpirit('speed').level >= 8000, group: 'speedSpirit'},
  394: { pointValue: 90, unlockCondition: () => getRuneSpirit('speed').level >= 10000, group: 'speedSpirit'},
  395: { pointValue: 100, unlockCondition: () => getRuneSpirit('speed').level >= 12500, group: 'speedSpirit'},
  396: { pointValue: 5, unlockCondition: () => getRune('speed').level >= 100, group: 'runeLevel' },
  397: { pointValue: 10, unlockCondition: () => getRune('speed').level >= 250, group: 'runeLevel' },
  398: { pointValue: 15, unlockCondition: () => getRune('speed').level >= 500, group: 'runeLevel' },
  399: { pointValue: 20, unlockCondition: () => getRune('speed').level >= 1000, group: 'runeLevel' },
  400: { pointValue: 25, unlockCondition: () => getRune('speed').level >= 2000, group: 'runeLevel' },
  401: { pointValue: 30, unlockCondition: () => getRune('speed').level >= 5000, group: 'runeLevel' },
  402: { pointValue: 35, unlockCondition: () => getRune('speed').level >= 10000, group: 'runeLevel' },
  403: { pointValue: 40, unlockCondition: () => getRune('speed').level >= 20000, group: 'runeLevel' },
  404: { pointValue: 45, unlockCondition: () => getRune('speed').level >= 50000, group: 'runeLevel' },
  405: { pointValue: 50, unlockCondition: () => getRune('speed').level >= 100000, group: 'runeLevel' },
  406: { pointValue: 55, unlockCondition: () => getRune('speed').level >= 200000, group: 'runeLevel' },
  407: { pointValue: 60, unlockCondition: () => getRune('speed').level >= 300000, group: 'runeLevel' },
  408: { pointValue: 65, unlockCondition: () => getRune('speed').level >= 500000, group: 'runeLevel' },
  409: { pointValue: 70, unlockCondition: () => getRune('speed').level >= 750000, group: 'runeLevel' },
  410: { pointValue: 75, unlockCondition: () => getRune('speed').level >= 1000000, group: 'runeLevel' },
  411: { pointValue: 5, unlockCondition: () => getRune('speed').freeLevels >= 50, group: 'runeFreeLevel' },
  412: { pointValue: 10, unlockCondition: () => getRune('speed').freeLevels >= 100, group: 'runeFreeLevel' },
  413: { pointValue: 15, unlockCondition: () => getRune('speed').freeLevels >= 250, group: 'runeFreeLevel' },
  414: { pointValue: 20, unlockCondition: () => getRune('speed').freeLevels >= 500, group: 'runeFreeLevel' },
  415: { pointValue: 25, unlockCondition: () => getRune('speed').freeLevels >= 1000, group: 'runeFreeLevel' },
  416: { pointValue: 30, unlockCondition: () => getRune('speed').freeLevels >= 2500, group: 'runeFreeLevel' },
  417: { pointValue: 35, unlockCondition: () => getRune('speed').freeLevels >= 5000, group: 'runeFreeLevel' },
  418: { pointValue: 40, unlockCondition: () => getRune('speed').freeLevels >= 10000, group: 'runeFreeLevel' },
  419: { pointValue: 45, unlockCondition: () => getRune('speed').freeLevels >= 20000, group: 'runeFreeLevel' },
  420: { pointValue: 50, unlockCondition: () => getRune('speed').freeLevels >= 50000, group: 'runeFreeLevel' },
  421: { pointValue: 55, unlockCondition: () => getRune('speed').freeLevels >= 100000, group: 'runeFreeLevel' },
  422: { pointValue: 60, unlockCondition: () => getRune('speed').freeLevels >= 200000, group: 'runeFreeLevel' },
  423: { pointValue: 65, unlockCondition: () => getRune('speed').freeLevels >= 300000, group: 'runeFreeLevel' },
  424: { pointValue: 70, unlockCondition: () => getRune('speed').freeLevels >= 500000, group: 'runeFreeLevel' },
  425: { pointValue: 75, unlockCondition: () => getRune('speed').freeLevels >= 750000, group: 'runeFreeLevel' },
}

export const ungroupedNameMap = {
  'participationTrophy': 0,
  'prestigeNoMult': 57,
  'transcendNoMult': 58,
  'reincarnationNoMult': 59,
  'prestigeNoAccelerator': 60,
  'transcendNoAccelerator': 61,
  'reincarnationNoAccelerator': 62,
  'diamondSearch': 63,
  'prestigeNoCoinUpgrade': 64,
  'transcendNoCoinUpgrade': 65,
  'transcendNoCoinDiamondUpgrade': 66,
  'reincarnationNoCoinUpgrade': 67,
  'reincarnationNoCoinDiamondUpgrade': 68,
  'reincarnationNoCoinDiamondMythosUpgrade': 69,
  'reincarnationMinimumUpgrades': 70,
  'generationAch1': 71,
  'generationAch2': 72,
  'generationAch3': 73,
  'generationAch4': 74,
  'chal1NoGen': 75,
  'chal2NoGen': 76,
  'chal3NoGen': 77,
  'metaChallenged': 238,
  'seeingRed': 239,
  'ascended': 240,
  'verySlow': 241,
  'veryFast': 242,
  'unsmith': 243,
  'smith': 244,
  'oneCubeOfMany': 246, // Intentional skip
  'extraChallenging': 247,
  'seeingRedNoBlue': 248,
  'overtaxed': 249,
  'thousandSuns': 250,
  'thousandMoons': 251,
  'sadisticAch': 252
}

export const numAchievements = Object.keys(achievements).length

// From achievements, I want to create an object whose keys are AchievementGroups and whose values are arrays of achievement numbers
// Corresponding to indices. I want to create it using `achievement` object.
export const achievementsByGroup: Record<AchievementGroups, number[]> = Object.entries(achievements)
  .reduce((groups, [index, achievement]) => {
    if (achievement.group) {
      if (!groups[achievement.group]) {
        groups[achievement.group] = []
      }
      groups[achievement.group].push(Number(index))
    }
    return groups
  }, {} as Record<AchievementGroups, number[]>)

console.log(achievementsByGroup)

// From achievements, I want to create an object whose keys are AchievementRewards and whose values are arrays of achievement numbers
// Corresponding to indices. I want to create it using `achievement` object.
export const achievementsByReward: Record<AchievementRewards, number[]> = Object.entries(achievements)
  .reduce((rewards, [index, achievement]) => {
    if (achievement.reward) {
      for (const rewardType of Object.keys(achievement.reward) as AchievementRewards[]) {
        if (!rewards[rewardType]) {
          rewards[rewardType] = []
        }
        rewards[rewardType].push(Number(index))
      }
    }
    return rewards
  }, {} as Record<AchievementRewards, number[]>)

export const getAchieveReward: Record<AchievementRewards, (ach: { [index: number]: boolean }) => number | boolean> = {
  acceleratorPower: (ach): number => {
    return achievementsByReward.acceleratorPower.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.acceleratorPower!() : 0), 0)
  },
  accelerators: (ach): number => {
    return achievementsByReward.accelerators.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.accelerators!() : 0), 0)
  },
  multipliers: (ach): number => {
    return achievementsByReward.multipliers.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.multipliers!() : 0), 0)
  },
  accelBoosts: (ach): number => {
    return achievementsByReward.accelBoosts.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.accelBoosts!() : 0), 0)
  },
  workerAutobuyer: (ach): boolean => {
    return ach[achievementsByReward.workerAutobuyer[0]]
  },
  investmentAutobuyer: (ach): boolean => {
    return ach[achievementsByReward.investmentAutobuyer[0]]
  },
  printerAutobuyer: (ach): boolean => {
    return ach[achievementsByReward.printerAutobuyer[0]]
  },
  mintAutobuyer: (ach): boolean => {
    return ach[achievementsByReward.mintAutobuyer[0]]
  },
  alchemyAutobuyer: (ach): boolean => {
    return ach[achievementsByReward.alchemyAutobuyer[0]]
  },
  offeringPrestigeTimer: (ach): boolean => {
    return ach[achievementsByReward.offeringPrestigeTimer[0]]
  },
  crystalMultiplier: (ach): number => {
    return achievementsByReward.crystalMultiplier.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.crystalMultiplier!() : 1), 1)
  },
  duplicationRuneUnlock: (ach): boolean => {
    return ach[achievementsByReward.duplicationRuneUnlock[0]]
  },
  quarkGain: (ach): number => {
    return achievementsByReward.quarkGain.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.quarkGain!() : 1), 1)
  },
  autoPrestigeFeature: (ach): boolean => {
    return ach[achievementsByReward.autoPrestigeFeature[0]]
  },
  prismRuneUnlock: (ach): boolean => {
    return ach[achievementsByReward.prismRuneUnlock[0]]
  },
  taxReduction: (ach): number => {
    return achievementsByReward.taxReduction.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.taxReduction!() : 1), 1)
  },
  particleGain: (ach): number => {
    return achievementsByReward.particleGain.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.particleGain!() : 1), 1)
  },
  multiplicativeObtainium: (ach): number => {
    return achievementsByReward.multiplicativeObtainium.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.multiplicativeObtainium!() : 1), 1)
  },
  multiplicativeOffering: (ach): number => {
    return achievementsByReward.multiplicativeOffering.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.multiplicativeOffering!() : 1), 1)
  },
  refineryAutobuy: (ach): boolean => {
    return ach[achievementsByReward.refineryAutobuy[0]]
  },
  coalPlantAutobuy: (ach): boolean => {
    return ach[achievementsByReward.coalPlantAutobuy[0]]
  },
  coalRigAutobuy: (ach): boolean => {
    return ach[achievementsByReward.coalRigAutobuy[0]]
  },
  pickaxeAutobuy: (ach): boolean => {
    return ach[achievementsByReward.pickaxeAutobuy[0]]
  },
  pandorasBoxAutobuy: (ach): boolean => {
    return ach[achievementsByReward.pandorasBoxAutobuy[0]]
  },
  crystalUpgrade1Autobuy: (ach): boolean => {
    return ach[achievementsByReward.crystalUpgrade1Autobuy[0]]
  },
  crystalUpgrade2Autobuy: (ach): boolean => {
    return ach[achievementsByReward.crystalUpgrade2Autobuy[0]]
  },
  crystalUpgrade3Autobuy: (ach): boolean => {
    return ach[achievementsByReward.crystalUpgrade3Autobuy[0]]
  },
  crystalUpgrade4Autobuy: (ach): boolean => {
    return ach[achievementsByReward.crystalUpgrade4Autobuy[0]]
  },
  crystalUpgrade5Autobuy: (ach): boolean => {
    return ach[achievementsByReward.crystalUpgrade5Autobuy[0]]
  },
  recycleChance: (ach): number => {
    return achievementsByReward.recycleChance.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.recycleChance!() : 0), 0)
  },
  exemptionTalisman: (ach): boolean => {
    return ach[achievementsByReward.exemptionTalisman[0]]
  },
  chronosTalisman: (ach): boolean => {
    return ach[achievementsByReward.chronosTalisman[0]]
  },
  midasTalisman: (ach): boolean => {
    return ach[achievementsByReward.midasTalisman[0]]
  },
  metaphysicsTalisman: (ach): boolean => {
    return ach[achievementsByReward.metaphysicsTalisman[0]]
  },
  polymathTalisman: (ach): boolean => {
    return ach[achievementsByReward.polymathTalisman[0]]
  },
  wowSquareTalisman: (ach): boolean => {
    return ach[achievementsByReward.wowSquareTalisman[0]]
  },
  conversionExponent: (ach): number => {
    return achievementsByReward.conversionExponent.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.conversionExponent!() : 0), 0)
  },
  chal7Researches: (ach): boolean => {
    return ach[achievementsByReward.chal7Researches[0]]
  },
  chal8Researches: (ach): boolean => {
    return ach[achievementsByReward.chal8Researches[0]]
  },
  chal9Researches: (ach): boolean => {
    return ach[achievementsByReward.chal9Researches[0]]
  },
  talismanPower: (ach): number => {
    return achievementsByReward.talismanPower.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.talismanPower!() : 0), 0)
  },
  sacrificeMult: (ach): number => {
    return achievementsByReward.sacrificeMult.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.sacrificeMult!() : 1), 1)
  },
  ascensionUnlock: (ach): boolean => {
    return ach[achievementsByReward.ascensionUnlock[0]]
  },
  antSpeed: (ach): number => {
    return achievementsByReward.antSpeed.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.antSpeed!() : 1), 1)
  },
  antSacrificeUnlock: (ach): boolean => {
    return ach[achievementsByReward.antSacrificeUnlock[0]]
  },
  antAutobuyers: (ach): number => {
    return achievementsByReward.antAutobuyers.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.antAutobuyers!() : 0), 0)
  },
  antUpgradeAutobuyers: (ach): number => {
    return achievementsByReward.antUpgradeAutobuyers.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.antUpgradeAutobuyers!() : 0), 0)
  },
  antELOAdditive: (ach): number => {
    return achievementsByReward.antELOAdditive.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.antELOAdditive!() : 0), 0)
  },
  antELOMultiplicative: (ach): number => {
    return achievementsByReward.antELOMultiplicative.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.antELOMultiplicative!() : 1), 1)
  },
  ascensionCountMultiplier: (ach): number => {
    return achievementsByReward.ascensionCountMultiplier.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.ascensionCountMultiplier!() : 1), 1)
  },
  ascensionCountAdditive: (ach): number => {
    return achievementsByReward.ascensionCountAdditive.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.ascensionCountAdditive!() : 0), 0)
  },
  allCubeGain: (ach): number => {
    return achievementsByReward.allCubeGain.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.allCubeGain!() : 1), 1)
  },
  wowCubeGain: (ach): number => {
    return achievementsByReward.wowCubeGain.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.wowCubeGain!() : 1), 1)
  },
  wowTesseractGain: (ach): number => {
    return achievementsByReward.wowTesseractGain.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.wowTesseractGain!() : 1), 1)
  },
  wowHypercubeGain: (ach): number => {
    return achievementsByReward.wowHypercubeGain.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.wowHypercubeGain!() : 1), 1)
  },
  wowPlatonicGain: (ach): number => {
    return achievementsByReward.wowPlatonicGain.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.wowPlatonicGain!() : 1), 1)
  },
  wowHepteractGain: (ach): number => {
    return achievementsByReward.wowHepteractGain.reduce((prod, index) => prod * (ach[index] ? achievements[index].reward!.wowHepteractGain!() : 1), 1)
  },
  ascensionScore: (ach): number => {
    return achievementsByReward.ascensionScore.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.ascensionScore!() : 0), 0)
  },
  ascensionRewardScaling: (ach): boolean => {
    return ach[achievementsByReward.ascensionRewardScaling[0]]
  },
  constUpgrade1Buff: (ach): number => {
    return achievementsByReward.constUpgrade1Buff.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.constUpgrade1Buff!() : 0), 0)
  },
  constUpgrade2Buff: (ach): number => {
    return achievementsByReward.constUpgrade2Buff.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.constUpgrade2Buff!() : 0), 0)
  },
  platonicToHypercubes: (ach): number => {
    return achievementsByReward.platonicToHypercubes.reduce((sum, index) => sum + (ach[index] ? achievements[index].reward!.platonicToHypercubes!() : 0), 0)
  },
  statTracker: (ach): boolean => {
    return ach[achievementsByReward.statTracker[0]]
  }
}

export const achievementManager = new AchievementManager(Array(numAchievements).fill(0) as number[])