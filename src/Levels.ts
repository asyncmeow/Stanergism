import i18next from "i18next"
import { format, formatAsPercentIncrease } from "./Synergism"
import { achievementLevel } from "./Achievements"
import { DOMCacheGetOrSet } from "./Cache/DOM"

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
        effect: (lv: number) => lv,
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