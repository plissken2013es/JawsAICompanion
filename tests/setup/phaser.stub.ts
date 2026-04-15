import { vi } from 'vitest'

vi.stubGlobal('Phaser', {
    Math: {
        RandomDataGenerator: class {
            realInRange(min: number, max: number) {
                return min + Math.random() * (max - min)
            }
            integerInRange(min: number, max: number) {
                return Math.floor(min + Math.random() * (max - min + 1))
            }
            pick(arr: any[]) {
                return arr[Math.floor(Math.random() * arr.length)]
            }
        }
    },
    Utils: {
        Array: {
            Shuffle: (arr: any[]) => [...arr].sort(() => Math.random() - 0.5)
        }
    }
})
