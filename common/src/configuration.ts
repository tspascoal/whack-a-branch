export interface Configuration {
  branches?: Branches | null | undefined
  onlyNew?: boolean | null
  deleteIfNoMatch?: boolean | null
  deleteForks?: boolean | null
}

export interface Branches {
  keep?: string[] | null | undefined
  delete?: string[] | null | undefined
}

export const DefaultConfiguration: Configuration = {
  branches: {
    keep: ['**']
  },
  onlyNew: false,
  deleteIfNoMatch: false
}
