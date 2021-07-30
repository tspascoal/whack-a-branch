// You can import your modules
// import index from '../src/index'

import { DeletePredicate } from "../src/deletepredicate"
import { Configuration } from "../src/configuration"

describe("DeletePredicate", () => {

  test("no deletion by default (name only)", () => {

    const config: Configuration = {}

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/main")

    expect(shouldDelete).toBeFalsy()
  })

  test("no deletion by default with depth 2", () => {

    const config: Configuration = {}

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/dev/feature-2")

    expect(shouldDelete).toBeFalsy()
  })

  test("no deletion by default with depth 3", () => {

    const config: Configuration = { }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/dev/feature-2/fixes")

    expect(shouldDelete).toBeFalsy()
  })


  test("no deletion with **", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["**"]
      }
    }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/main")

    expect(shouldDelete).toBeFalsy()
  })

  test("no deletion with ** and depth", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["**"],
      }
    }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/main")

    expect(shouldDelete).toBeFalsy()
  })


  test("delete everything", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        delete: ["**"],
      }
    }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/hello")

    expect(shouldDelete).toBeTruthy()
  })

  test("deletion with override", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["**", "other_branch"],
        delete: ["mybranch"]
      }
    }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/mybranch")

    expect(shouldDelete).toBeTruthy()
  })

  test("deletion with override which specifies heads", () => {

    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["**"],
        delete: ["heads/mybranch"]
      }
    }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/mybranch")

    expect(shouldDelete).toBeTruthy()
  })

  test("no deletion with ambiguous rule and deleteIfNoMatch not specified", () => {

    const config: Configuration = {
      branches: {
        keep: ["master"],
        delete: ["heads/mybranch"]
      }
    }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/NOTINTHELIST")

    expect(shouldDelete).toBeFalsy()
  })

  test("delete with ambiguous rule and deleteIfNoMatch set to true", () => {
    const config: Configuration = {
      deleteIfNoMatch: true,
      branches: {
        keep: ["master"],
        delete: ["heads/mybranch"]
      }
    }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/NOTINTHELIST")

    expect(shouldDelete).toBeTruthy()
  })

  test("delete anything with more than one level", () => {
    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["*"],
        delete: ["*/**"]
      }
    }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/dev/test")
    const shouldDeleteMaster = DeletePredicate.shouldDelete(config, "heads/master")


    expect(shouldDelete).toBeTruthy()    
    expect(shouldDeleteMaster).toBeFalsy()
  })

  test("deletion with different casing", () => {
    const config: Configuration = {
      deleteIfNoMatch: false,
      branches: {
        keep: ["*"],
        delete: ["MASTER"]
      }
    }

    const shouldDelete = DeletePredicate.shouldDelete(config, "heads/master")
  
    expect(shouldDelete).toBeTruthy()
  })
})
