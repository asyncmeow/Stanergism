export interface IUpgradeData {
  name: string
  description: string
  level?: number
  maxLevel: number
  costPerLevel: number
  toggleBuy?: number
  effect?(this: void, n: number): { bonus: number | boolean; desc: () => string }
  freeLevels?: number
}

export abstract class DynamicUpgrade {
  public name: string
  readonly description: string
  public level = 0
  public freeLevels = 0
  readonly maxLevel: number // -1 = infinitely levelable
  readonly costPerLevel: number
  public toggleBuy = 1 // -1 = buy MAX (or 1000 in case of infinity levels!)
  readonly effect: (n: number) => { bonus: number | boolean; desc: () => string }

  constructor (data: IUpgradeData) {
    this.name = data.name
    this.description = data.description
    this.level = data.level ?? 0
    this.freeLevels = data.freeLevels ?? 0
    this.maxLevel = data.maxLevel
    this.costPerLevel = data.costPerLevel
    this.toggleBuy = data.toggleBuy ?? 1
    this.effect = data.effect ?? ((n: number) => ({ bonus: n, desc: () => 'WIP not implemented' }))
  }

  public getEffect (): { bonus: number | boolean; desc: () => string } {
    const effectiveLevel = this.level + Math.min(this.level, this.freeLevels)
      + Math.sqrt(Math.max(0, this.freeLevels - this.level))
    return this.effect(effectiveLevel)
  }

  abstract toString (): string
  abstract updateUpgradeHTML (): void
  abstract getCostTNL (): number
  public abstract buyLevel (event: MouseEvent): Promise<void> | void
}
