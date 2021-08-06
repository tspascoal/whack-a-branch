import { shouldDelete } from "../src/deletepredicate"
import { Configuration } from "../src/configuration"

describe("DeletePredicate", () => {

  test("no deletion by default (name only)", () => {

    const config: Configuration = {}

    const deleteIt = shouldDelete(config, "heads/main")

    expect(deleteIt).toBeFalsy()
  })

  test("no deletion by default with depth 2", () => {

    const config: Configuration = {}

    const deleteIt = shouldDelete(config, "heads/dev/feature-2")

    expect(deleteIt).toBeFalsy()
  })

  test("no deletion by default with depth 3", () => {

    const config: Configuration = { }

    const deleteIt = shouldDelete(config, "heads/dev/feature-2/fixes")

    expect(deleteIt).toBeFalsy()
  })


  test("no deletion with **", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["**"]
      }
    }

    const deleteIt = shouldDelete(config, "heads/main")

    expect(deleteIt).toBeFalsy()
  })

  test("no deletion with ** and depth", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["**"],
      }
    }

    const deleteIt = shouldDelete(config, "heads/main")

    expect(deleteIt).toBeFalsy()
  })


  test("delete everything", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        delete: ["**"],
      }
    }

    const deleteIt = shouldDelete(config, "heads/hello")

    expect(deleteIt).toBeTruthy()
  })

  test("deletion with override", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["**", "other_branch"],
        delete: ["mybranch"]
      }
    }

    const deleteIt = shouldDelete(config, "heads/mybranch")

    expect(deleteIt).toBeTruthy()
  })

  test("deletion with override which specifies heads", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["**"],
        delete: ["heads/mybranch"]
      }
    }

    const deleteIt = shouldDelete(config, "heads/mybranch")

    expect(deleteIt).toBeTruthy()
  })

  test("no deletion with ambiguous rule and deleteIfNoMatch not specified", () => {

    const config: Configuration = {
      branches: {
        keep: ["master"],
        delete: ["heads/mybranch"]
      }
    }

    const deleteIt = shouldDelete(config, "heads/NOTINTHELIST")

    expect(deleteIt).toBeFalsy()
  })

  test("delete with ambiguous rule and deleteIfNoMatch set to true", () => {
    const config: Configuration = {
      deleteIfNoMatch: true,
      branches: {
        keep: ["master"],
        delete: ["heads/mybranch"]
      }
    }

    const deleteIt = shouldDelete(config, "heads/NOTINTHELIST")

    expect(deleteIt).toBeTruthy()
  })

  test("delete anything with more than one level", () => {
    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["*"],
        delete: ["*/**"]
      }
    }

    const deleteIt = shouldDelete(config, "heads/dev/test")
    const deleteMaster = shouldDelete(config, "heads/master")


    expect(deleteIt).toBeTruthy()    
    expect(deleteMaster).toBeFalsy()
  })

  test("deletion with different casing", () => {
    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["*"],
        delete: ["MASTER"]
      }
    }

    const deleteIt = shouldDelete(config, "heads/master")
  
    expect(deleteIt).toBeTruthy()
  })
})
