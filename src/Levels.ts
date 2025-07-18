import i18next from "i18next"
import { format, formatAsPercentIncrease, player } from "./Synergism"
import { achievementLevel } from "./Achievements"
import { DOMCacheGetOrSet } from "./Cache/DOM"
import { resetTimeThreshold } from "./Calculate"

export type SynergismLevelReward = 'quarks' | 'salvage' | 'obtainium' | 'offerings' | 'wowCubes' | 'wowTesseracts' | 'wowHyperCubes' |
'wowPlatonicCubes' | 'wowHepteractCubes' | 'wowOcteracts' |
'ambrosiaLuck' | 'redAmbrosiaLuck'

export interface SynergismLevelRewardData {
    name: () => string
    description: () => string
    effect: (lv: number) => number
    effectDescription: () => string
    minLevel: number
    defaultValue: number
    nameColor: string
}

export const synergismLevelRewards: Record<SynergismLevelReward, SynergismLevelRewardData> = {
    salvage: {
        name: () => i18next.t('achievements.levelRewards.salvage.name'),
        description: () => i18next.t('achievements.levelRewards.salvage.description'),
        effect: (lv: number) => {
            let salvage = 0
            let salavePerLevel = 1
            let remainingLevels = lv
            while (remainingLevels >= 100) {
                salvage += salavePerLevel * 100
                remainingLevels -= 100
                salavePerLevel += 1
            }
            salvage += salavePerLevel * remainingLevels
            return salvage
        },
        effectDescription: () => {
            const salvage = getLevelReward('salvage')
            return i18next.t('achievements.levelRewards.salvage.effect', {
                salvage: format(salvage, 0, true)
            })
        },
        minLevel: 0,
        defaultValue: 0,
        nameColor: 'green'
    },
    quarks: {
        name: () => i18next.t('achievements.levelRewards.quarks.name'),
        description: () => i18next.t('achievements.levelRewards.quarks.description'),
        effect: (lv: number) => Math.pow(1.01, Math.floor(lv / 20)),
        effectDescription: () => {
            const multiplier = getLevelReward('quarks')
            return i18next.t('achievements.levelRewards.quarks.effect', {
                mult: formatAsPercentIncrease(multiplier, 2)
            })
        },
        minLevel: 20,
        defaultValue: 1,
        nameColor: 'cyan'
    },
    offerings: {
        name: () => i18next.t('achievements.levelRewards.offerings.name'),
        description: () => i18next.t('achievements.levelRewards.offerings.description'),
        effect: (lv: number) => Math.pow(1.01, lv) * Math.pow(1.02, Math.max(0, lv - 100)),
        effectDescription: () => {
            const multiplier = getLevelReward('offerings')
            return i18next.t('achievements.levelRewards.offerings.effect', {
                mult: formatAsPercentIncrease(multiplier, 2)
            })
        },
        minLevel: 0,
        defaultValue: 1,
        nameColor: 'orange'
    },
    obtainium: {
        name: () => i18next.t('achievements.levelRewards.obtainium.name'),
        description: () => i18next.t('achievements.levelRewards.obtainium.description'),
        effect: (lv: number) => Math.pow(1.01, lv - 15) * Math.pow(1.02, Math.max(0, lv - 100)),
        effectDescription: () => {
            const multiplier = getLevelReward('obtainium')
            return i18next.t('achievements.levelRewards.obtainium.effect', {
                mult: formatAsPercentIncrease(multiplier, 2)
            })
        },
        minLevel: 15,
        defaultValue: 1,
        nameColor: 'pink'
    },
    wowCubes: {
        name: () => i18next.t('achievements.levelRewards.wowCubes.name'),
        description: () => i18next.t('achievements.levelRewards.wowCubes.description'),
        effect: (lv: number) => 1 + (lv - 19) / 20,
        effectDescription: () => {
            const multiplier = getLevelReward('wowCubes')
            return i18next.t('achievements.levelRewards.wowCubes.effect', {
                mult: formatAsPercentIncrease(multiplier, 2)
            })
        },
        minLevel: 20,
        defaultValue: 1,
        nameColor: 'lightgrey'
    },
    wowTesseracts: {
        name: () => i18next.t('achievements.levelRewards.wowTesseracts.name'),
        description: () => i18next.t('achievements.levelRewards.wowTesseracts.description'),
        effect: (lv: number) => 1 + (lv - 29) / 20,
        effectDescription: () => {
            const multiplier = getLevelReward('wowTesseracts')
            return i18next.t('achievements.levelRewards.wowTesseracts.effect', {
                mult: formatAsPercentIncrease(multiplier, 2)
            })
        },
        minLevel: 30,
        defaultValue: 1,
        nameColor: 'orchid'
    },
    wowHyperCubes: {
        name: () => i18next.t('achievements.levelRewards.wowHyperCubes.name'),
        description: () => i18next.t('achievements.levelRewards.wowHyperCubes.description'),
        effect: (lv: number) => 1 + (lv - 39) / 20,
        effectDescription: () => {
            const multiplier = getLevelReward('wowHyperCubes')
            return i18next.t('achievements.levelRewards.wowHyperCubes.effect', {
                mult: formatAsPercentIncrease(multiplier, 2)
            })
        },
        minLevel: 40,
        defaultValue: 1,
        nameColor: 'crimson'
    },
    wowPlatonicCubes: {
        name: () => i18next.t('achievements.levelRewards.wowPlatonicCubes.name'),
        description: () => i18next.t('achievements.levelRewards.wowPlatonicCubes.description'),
        effect: (lv: number) => 1 + (lv - 49) / 20,
        effectDescription: () => {
            const multiplier = getLevelReward('wowPlatonicCubes')
            return i18next.t('achievements.levelRewards.wowPlatonicCubes.effect', {
                mult: formatAsPercentIncrease(multiplier, 2)
            })
        },
        minLevel: 50,
        defaultValue: 1,
        nameColor: 'lightgoldenrodyellow'
    },
    wowHepteractCubes: {
        name: () => i18next.t('achievements.levelRewards.wowHepteractCubes.name'),
        description: () => i18next.t('achievements.levelRewards.wowHepteractCubes.description'),
        effect: (lv: number) => 1 + (lv - 69) / 20,
        effectDescription: () => {
            const multiplier = getLevelReward('wowHepteractCubes')
            return i18next.t('achievements.levelRewards.wowHepteractCubes.effect', {
                mult: formatAsPercentIncrease(multiplier, 2)
            })
        },
        minLevel: 70,
        defaultValue: 1,
        nameColor: 'mediumpurple'
    },
    wowOcteracts: {
        name: () => i18next.t('achievements.levelRewards.wowOcteracts.name'),
        description: () => i18next.t('achievements.levelRewards.wowOcteracts.description'),
        effect: (lv: number) => (1 + (lv - 149) / 20) * Math.pow(1.02, lv - 149),
        effectDescription: () => {
            const multiplier = getLevelReward('wowOcteracts')
            return i18next.t('achievements.levelRewards.wowOcteracts.effect', {
                mult: formatAsPercentIncrease(multiplier, 2)
            })
        },
        minLevel: 150,
        defaultValue: 1,
        nameColor: 'turquoise'
    },
    ambrosiaLuck: {
        name: () => i18next.t('achievements.levelRewards.ambrosiaLuck.name'),
        description: () => i18next.t('achievements.levelRewards.ambrosiaLuck.description'),
        effect: (lv: number) => 4 * (lv - 199),
        effectDescription: () => {
            const luck = getLevelReward('ambrosiaLuck')
            return i18next.t('achievements.levelRewards.ambrosiaLuck.effect', {
                luck: format(luck, 0, true)
            })
        },
        minLevel: 200,
        defaultValue: 0,
        nameColor: 'lime'
    },
    redAmbrosiaLuck: {
        name: () => i18next.t('achievements.levelRewards.redAmbrosiaLuck.name'),
        description: () => i18next.t('achievements.levelRewards.redAmbrosiaLuck.description'),
        effect: (lv: number) => lv - 249,
        effectDescription: () => {
            const luck = getLevelReward('redAmbrosiaLuck')
            return i18next.t('achievements.levelRewards.redAmbrosiaLuck.effect', {
                luck: format(luck, 0, true)
            })
        },
        minLevel: 250,
        defaultValue: 0,
        nameColor: 'red'
    }
}

export const synergismLevelReward = Object.keys(synergismLevelRewards) as SynergismLevelReward[]

export const getLevelReward = (reward: SynergismLevelReward): number => {
    if (achievementLevel >= synergismLevelRewards[reward].minLevel) {
        return synergismLevelRewards[reward].effect(achievementLevel)
    } else {
        return synergismLevelRewards[reward].defaultValue
    }
}

export const getLevelRewardDescription = (reward: SynergismLevelReward) => {
    const name = synergismLevelRewards[reward].name()
    const description = synergismLevelRewards[reward].description()
    const effectDesc = synergismLevelRewards[reward].effectDescription()
    const minimumLevel = synergismLevelRewards[reward].minLevel > 0
    ? i18next.t('achievements.levelRewards.minLevel', {
        level: synergismLevelRewards[reward].minLevel
    }) : i18next.t('achievements.levelRewards.noLevelReq')

    const nameColor = synergismLevelRewards[reward].nameColor

    DOMCacheGetOrSet('synergismLevelMultiLine').innerHTML = `
        <span style="color:${nameColor}">${name}</span><br>
        ${minimumLevel}<br>
        ${description}<br>
        ${effectDesc}
    `
}

export const generateLevelRewardHTMLs = () => {
    const alreadyGenerated = document.getElementsByClassName('synergismLevelRewardType').length > 0
    if (alreadyGenerated) {
        return
    }
    const rewardTable = DOMCacheGetOrSet('synergismLevelRewardsTable')
    for (const reward of synergismLevelReward) {
        const capitalizedName = reward.charAt(0).toUpperCase() + reward.slice(1)
        
        const div = document.createElement('div')
        div.classList.add('synergismLevelRewardType')

        const img = document.createElement('img')
        img.id = `synergismLevelReward${capitalizedName}`
        img.src = `Pictures/Achievements/Rewards/${capitalizedName}.png`
        img.alt = synergismLevelRewards[reward].name()
        img.style.cursor = 'pointer'
  
        img.onclick = () => {
          getLevelRewardDescription(reward)
        }
        img.onmouseover = () => {
            getLevelRewardDescription(reward)
        }
        img.focus = () => {
            getLevelRewardDescription(reward)
        }
        div.appendChild(img)
        rewardTable.appendChild(div)
    }
}

export type SynergismLevelMilestones = 'offeringTimerScaling' | 'duplicationRune' | 'prismRune' | 'thriftRune' | 'autoPrestige' |
'tier1CrystalAutobuy' | 'tier2CrystalAutobuy' | 'tier3CrystalAutobuy' | 'tier4CrystalAutobuy' | 'tier5CrystalAutobuy' |
'achievementTalismanUnlock' | 'achievementTalismanEnhancement'

interface SynergismLevelMilestoneData {
    name: () => string
    description: () => string
    effect: () => number
    defaultValue: number // If level is not reached.
    effectDescription: () => string
    levelReq: number
    displayOrder: number
}

export const synergismLevelMilestones: Record<SynergismLevelMilestones, SynergismLevelMilestoneData> = {
    offeringTimerScaling: {
        name: () => i18next.t('achievements.levelMilestones.offeringTimerScaling.name'),
        description: () => i18next.t('achievements.levelMilestones.offeringTimerScaling.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const mult = getLevelMilestone('offeringTimerScaling') === 1 ?
                Math.max(1, player.prestigecounter / resetTimeThreshold()) :
                1
            return i18next.t('achievements.levelMilestones.offeringTimerScaling.effect', {
                mult: formatAsPercentIncrease(mult, 2)
            })
        },
        levelReq: 5,
        displayOrder: 1
    },
    autoPrestige: {
        name: () => i18next.t('achievements.levelMilestones.autoPrestige.name'),
        description: () => i18next.t('achievements.levelMilestones.autoPrestige.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const autoPrestige = getLevelMilestone('autoPrestige') === 1
            return i18next.t('achievements.levelMilestones.autoPrestige.effect', {
                autoPrestige: autoPrestige ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 10,
        displayOrder: 2
    },
    duplicationRune: {
        name: () => i18next.t('achievements.levelMilestones.duplicationRune.name'),
        description: () => i18next.t('achievements.levelMilestones.duplicationRune.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const duplicationRune = getLevelMilestone('duplicationRune') === 1
            return i18next.t('achievements.levelMilestones.duplicationRune.effect', {
                duplicationRune: duplicationRune ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 10,
        displayOrder: 3
    },
    prismRune: {
        name: () => i18next.t('achievements.levelMilestones.prismRune.name'),
        description: () => i18next.t('achievements.levelMilestones.prismRune.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const prismRune = getLevelMilestone('prismRune') === 1
            return i18next.t('achievements.levelMilestones.prismRune.effect', {
                prismRune: prismRune ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 20,
        displayOrder: 4
    },
    thriftRune: {
        name: () => i18next.t('achievements.levelMilestones.thriftRune.name'),
        description: () => i18next.t('achievements.levelMilestones.thriftRune.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const thriftRune = getLevelMilestone('thriftRune') === 1
            return i18next.t('achievements.levelMilestones.thriftRune.effect', {
                thriftRune: thriftRune ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 30,
        displayOrder: 5
    },
    tier1CrystalAutobuy: {
        name: () => i18next.t('achievements.levelMilestones.tier1CrystalAutobuy.name'),
        description: () => i18next.t('achievements.levelMilestones.tier1CrystalAutobuy.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const autobuy = getLevelMilestone('tier1CrystalAutobuy') === 1
            return i18next.t('achievements.levelMilestones.tier1CrystalAutobuy.effect', {
                autobuy: autobuy ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 6,
        displayOrder: 6
    },
    tier2CrystalAutobuy: {
        name: () => i18next.t('achievements.levelMilestones.tier2CrystalAutobuy.name'),
        description: () => i18next.t('achievements.levelMilestones.tier2CrystalAutobuy.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const autobuy = getLevelMilestone('tier2CrystalAutobuy') === 1
            return i18next.t('achievements.levelMilestones.tier2CrystalAutobuy.effect', {
                autobuy: autobuy ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 9,
        displayOrder: 7
    },
    tier3CrystalAutobuy: {
        name: () => i18next.t('achievements.levelMilestones.tier3CrystalAutobuy.name'),
        description: () => i18next.t('achievements.levelMilestones.tier3CrystalAutobuy.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const autobuy = getLevelMilestone('tier3CrystalAutobuy') === 1
            return i18next.t('achievements.levelMilestones.tier3CrystalAutobuy.effect', {
                autobuy: autobuy ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 12,
        displayOrder: 8
    },
    tier4CrystalAutobuy: {
        name: () => i18next.t('achievements.levelMilestones.tier4CrystalAutobuy.name'),
        description: () => i18next.t('achievements.levelMilestones.tier4CrystalAutobuy.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const autobuy = getLevelMilestone('tier4CrystalAutobuy') === 1
            return i18next.t('achievements.levelMilestones.tier4CrystalAutobuy.effect', {
                autobuy: autobuy ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 15,
        displayOrder: 9
    },
    tier5CrystalAutobuy: {
        name: () => i18next.t('achievements.levelMilestones.tier5CrystalAutobuy.name'),
        description: () => i18next.t('achievements.levelMilestones.tier5CrystalAutobuy.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const autobuy = getLevelMilestone('tier5CrystalAutobuy') === 1
            return i18next.t('achievements.levelMilestones.tier5CrystalAutobuy.effect', {
                autobuy: autobuy ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 20,
        displayOrder: 10
    },
    achievementTalismanUnlock: {
        name: () => i18next.t('achievements.levelMilestones.achievementTalismanUnlock.name'),
        description: () => i18next.t('achievements.levelMilestones.achievementTalismanUnlock.description'),
        effect: () => 1,
        defaultValue: 0,
        effectDescription: () => {
            const unlocked = getLevelMilestone('achievementTalismanUnlock') === 1
            return i18next.t('achievements.levelMilestones.achievementTalismanUnlock.effect', {
                unlocked: unlocked ? i18next.t('achievements.rewardTypes.unlocked') : i18next.t('achievements.rewardTypes.locked')
            })
        },
        levelReq: 100,
        displayOrder: 11
    },
    achievementTalismanEnhancement: {
        name: () => i18next.t('achievements.levelMilestones.achievementTalismanEnhancement.name'),
        description: () => i18next.t('achievements.levelMilestones.achievementTalismanEnhancement.description'),
        effect: () => achievementLevel,
        defaultValue: 0,
        effectDescription: () => {
            const level = getLevelMilestone('achievementTalismanEnhancement')
            return i18next.t('achievements.levelMilestones.achievementTalismanEnhancement.effect', {
                level: format(level, 0, true)
            })
        },
        levelReq: 160,
        displayOrder: 12
    }
}

export const synergismLevelMilestone = Object.keys(synergismLevelMilestones) as SynergismLevelMilestones[]

export const getLevelMilestone = (milestone: SynergismLevelMilestones): number => {
    if (achievementLevel >= synergismLevelMilestones[milestone].levelReq) {
        return synergismLevelMilestones[milestone].effect()
    } else {
        return synergismLevelMilestones[milestone].defaultValue
    }
}

export const getLevelMilestoneDescription = (milestone: SynergismLevelMilestones) => {
    const name = synergismLevelMilestones[milestone].name()
    const description = synergismLevelMilestones[milestone].description()
    const effectDesc = synergismLevelMilestones[milestone].effectDescription()
    const minimumLevel = i18next.t('achievements.levelRewards.minLevel', {
        level: synergismLevelMilestones[milestone].levelReq
    })

    DOMCacheGetOrSet('synergismLevelMultiLine').innerHTML = `
        <span style="color:lightblue">${name}</span><br>
        ${minimumLevel}<br>
        ${description}<br>
        ${effectDesc}
    `
}

export const generateLevelMilestoneHTMLS = () => {
    const alreadyGenerated = document.getElementsByClassName('synergismLevelMilestoneType').length > 0
    if (alreadyGenerated) {
        return
    }
    const rewardTable = DOMCacheGetOrSet('synergismLevelMilestonesTable')
    for (const milestone of synergismLevelMilestone) {
        const capitalizedName = milestone.charAt(0).toUpperCase() + milestone.slice(1)
        
        const div = document.createElement('div')
        div.classList.add('synergismLevelMilestoneType')

        const img = document.createElement('img')
        img.id = `synergismLevelMilestone${capitalizedName}`
        img.src = `Pictures/Achievements/Rewards/${capitalizedName}.png`
        img.alt = synergismLevelMilestones[milestone].name()
        img.style.cursor = 'pointer'
  
        img.onclick = () => {
          getLevelMilestoneDescription(milestone)
        }
        img.onmouseover = () => {
            getLevelMilestoneDescription(milestone)
        }
        img.focus = () => {
            getLevelMilestoneDescription(milestone)
        }
        div.appendChild(img)
        rewardTable.appendChild(div)
    }
}