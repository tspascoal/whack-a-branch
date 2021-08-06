import nock from "nock"
import whackABranchApp from "../src"
import { Probot, ProbotOctokit} from "probot"
import {
  expect,
  test,
  describe,
  beforeEach,
  afterEach
} from '@jest/globals'

// Requiring our fixtures
import payload_push from "./fixtures/push.json"

const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8"
);

describe("whack-a-branch", () => {
  let probot: any

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
      logLevel: "fatal" // reduce log noise for testing
    })
    probot.load(whackABranchApp)

    nock('https://api.github.com')
      .get('/repos/tspascoal/test/contents/.github%2Fwhack-a-branch.yml', () => {
        return true
      })
      .reply(200,
        `onlyNew: true
branches:
  onlyNew: true
  keep: 
  - '**'
  delete:
  - 'delete*'
  `)
  })

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  })

  test("delete branch", async () => {
    nock("https://api.github.com")
      // Test that we correctly return a test token
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          contents: "write",
          metadata: "read"
        },
      })

    const deleteMock = nock('https://api.github.com')
      .delete("/repos/tspascoal/test/git/refs/heads%2Fdeleteme")
      .reply(204)

    // Receive push event
    await probot.receive({ name: "push", "payload": payload_push })

    expect(deleteMock.pendingMocks().length).toBe(0)
  })

  test("do not delete master branch", async () => {
    nock("https://api.github.com")
      // Test that we correctly return a test token
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          contents: "write",
          metadata: "read"
        },
      })

    const deleteMock = nock('https://api.github.com')
      .delete('/repos/tspascoal/test/git/refs/heads%2Fmain')
      .reply(204)

    let payload_main = { ...payload_push, ref: "refs/heads/main" }
    // Receive push event
    await probot.receive({ name: "push", "payload": payload_main })

    // delete was not called
    expect(deleteMock.pendingMocks()).toContain("DELETE https://api.github.com:443/repos/tspascoal/test/git/refs/heads%2Fmain")
  })

  test("do not delete fork", async () => {
    nock("https://api.github.com")
      // Test that we correctly return a test token
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          contents: "write",
          metadata: "read"
        },
      })

    const deleteMock = nock('https://api.github.com')
      .delete('/repos/tspascoal/test/git/refs/heads%2Fdeletemefork')
      .reply(204)

    let payload_fork = { ...payload_push, ref: "refs/heads/deletemefork" }
    payload_fork.repository = { ...payload_fork.repository, fork: true }

    // Receive push event
    await probot.receive({ name: "push", "payload": payload_fork })

    // delete was not called
    expect(deleteMock.pendingMocks()).toContain("DELETE https://api.github.com:443/repos/tspascoal/test/git/refs/heads%2Fdeletemefork")
  })

  test("do not delete push to existing branch", async () => {
    nock("https://api.github.com")
      // Test that we correctly return a test token
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          contents: "write",
          metadata: "read"
        },
      })

    const deleteMock = nock('https://api.github.com')
      .delete('/repos/tspascoal/test/git/refs/heads%2Fdeleteme')
      .reply(204)


    let payload_not_created = { ...payload_push, created: false }

    // Receive push event
    await probot.receive({ name: "push", "payload": payload_not_created })

    // delete was not called
    expect(deleteMock.pendingMocks()).toContain("DELETE https://api.github.com:443/repos/tspascoal/test/git/refs/heads%2Fdeleteme")
  })

  test("do not delete deleted branch", async () => {
    nock("https://api.github.com")
      // Test that we correctly return a test token
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          contents: "write",
          metadata: "read"
        },
      })

    const deleteMock = nock('https://api.github.com')
      .delete('/repos/tspascoal/test/git/refs/heads%2Fdeleteme')
      .reply(204)


    let payload_deleted = { ...payload_push, deleted: true }

    // Receive push event
    await probot.receive({ name: "push", "payload": payload_deleted })

    // delete was not called
    expect(deleteMock.pendingMocks()).toContain("DELETE https://api.github.com:443/repos/tspascoal/test/git/refs/heads%2Fdeleteme")
  })
})
