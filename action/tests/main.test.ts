import {run} from '../src/main'
import nock from 'nock'
import {
  expect,
  test,
  describe,
  jest,
  beforeAll,
  beforeEach,
  afterEach
} from '@jest/globals'

import * as core from '@actions/core'

import branches_list from './fixtures/branches.json'

const REPO = 'monalisa/helloworld'

function mock_list_branches(): nock.Scope {
  return nock('https://api.github.com')
    .get(`/repos/${REPO}/branches?protected=false`)
    .reply(200, branches_list)
}

function mock_delete_ref(ref: string): nock.Scope {
  ref = ref.replace('/', '%2F')
  return nock('https://api.github.com')
    .delete(`/repos/${REPO}/git/refs/heads%2F${ref}`)
    .reply(204)
}

function mock_delete_ref_multiple_calls(
  refPattern: string,
  numberCalls: number
): nock.Scope {
  refPattern = refPattern.replace('/', '%2F')
  return nock('https://api.github.com')
    .delete(new RegExp(`/repos/${REPO}/git/refs/heads%2F${refPattern}`))
    .times(numberCalls)
    .reply(204)
}

describe('run', () => {
  let restoreEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})
  })

  beforeEach(() => {
    nock.disableNetConnect()

    nock.cleanAll()
    restoreEnv = {...process.env}

    Object.keys(process.env).every(key => {
      if (key.toUpperCase().startsWith('INPUT_')) {
        delete process.env[key]
      }
    })
    process.env['GITHUB_REPOSITORY'] = REPO
    process.env['INPUT_TOKEN'] = 'ghp_dummy'
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
    process.env = restoreEnv
  })

  test('no deletions', async () => {
    process.env['INPUT_BRANCHES-KEEP'] = '**'
    process.env['INPUT_DELETE-IF-NO-MATCH'] = 'false'
    process.env['INPUT_DRY-RUN'] = 'false'

    const listBranchesMock = mock_list_branches()
    const deleteMock = mock_delete_ref('deleteme')

    await run()

    expect(listBranchesMock.pendingMocks().length).toBe(0)
    expect(deleteMock.pendingMocks().length).toBe(1)
  })

  test('one deletion', async () => {
    const listBranchesMock = mock_list_branches()
    const deleteMock = mock_delete_ref('deleteme')

    process.env['INPUT_BRANCHES-KEEP'] = '**'
    process.env['INPUT_BRANCHES-DELETE'] = 'deleteme'
    process.env['INPUT_DELETE-IF-NO-MATCH'] = 'false'
    process.env['INPUT_DRY-RUN'] = 'false'

    await run()

    expect(listBranchesMock.pendingMocks().length).toBe(0)
    expect(deleteMock.pendingMocks().length).toBe(0)
  })

  test('multiple deletions', async () => {
    const listBranchesMock = mock_list_branches()
    const deleteMock = mock_delete_ref_multiple_calls('dev/fix[1-2]', 2)

    process.env['INPUT_BRANCHES-KEEP'] = '**'
    process.env['INPUT_BRANCHES-DELETE'] = 'dummy, noway/**, dev/**'
    process.env['INPUT_DELETE-IF-NO-MATCH'] = 'false'
    process.env['INPUT_DRY-RUN'] = 'false'

    await run()

    expect(listBranchesMock.pendingMocks().length).toBe(0)
    expect(deleteMock.pendingMocks().length).toBe(0)
  })

  test('no deletion with dry run', async () => {
    const listBranchesMock = mock_list_branches()
    const deleteMock = mock_delete_ref('deleteme')

    process.env['INPUT_BRANCHES-KEEP'] = '**'
    process.env['INPUT_BRANCHES-DELETE'] = 'deleteme'
    process.env['INPUT_DELETE-IF-NO-MATCH'] = 'false'
    process.env['INPUT_DRY-RUN'] = 'true'

    await run()

    expect(listBranchesMock.pendingMocks().length).toBe(0)
    expect(deleteMock.pendingMocks().length).toBe(1)
  })
})
