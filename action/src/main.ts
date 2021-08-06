import * as core from '@actions/core'
import * as github from '@actions/github'
import { context } from '@actions/github/lib/utils'

import { Configuration } from '../../common/lib/src/configuration'
import { shouldDelete } from '../../common/lib/src/deletepredicate'

// fix for https://github.com/actions/toolkit/issues/844
function getBooleanInputFix(
  name: string,
  options: core.InputOptions,
  defaultValue: boolean
): boolean {
  if (core.getInput(name, options).trim() === '') return defaultValue

  return core.getBooleanInput(name, options)
}

export async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('token', { required: true })
    const branchesKeep: string =
      core.getInput('branches-keep', { required: true, trimWhitespace: true }) ||
      '**'
    const branchesDelete: string = core.getInput('branches-delete', {
      required: false,
      trimWhitespace: true
    })
    const deleteIfNoMatch: boolean = getBooleanInputFix(
      'delete-if-no-match',
      { required: false },
      false
    )
    const dryRun: boolean = getBooleanInputFix(
      'dry-run',
      { required: false },
      false
    )
    // Don't trim whitespace so "\n" gets the right behavior
    const outputSeparator: string =
      core.getInput('output-separator', {
        required: false,
        trimWhitespace: false
      }) || ','

    const octokit = github.getOctokit(githubToken)

    const branches = await octokit.paginate(octokit.rest.repos.listBranches, {
      owner: context.repo.owner,
      repo: context.repo.repo,
      protected: true
    })

    core.debug(`found #${branches.length} branches`)

    const deletedBranchs: string[] = []
    const config: Configuration = {
      branches: {
        keep: branchesKeep?.split(',').map(s => s.trim()),
        delete: branchesDelete?.split(',').map(s => s.trim())
      },
      deleteIfNoMatch
    }

    for (const branch of branches) {
      const refName = `heads/${branch.name}`

      // if (branch.protected) {
      //   // Just in case. In the API we only asked for unprotected branches
      //   core.info(`Kept protected branch ${refName}`)
      //   continue
      // }

      if (shouldDelete(config, refName)) {
        try {
          if (!dryRun) {
            await octokit.rest.git.deleteRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: refName
            })
          }
        } catch (e) {
          core.error(`Failed to delete ${refName} ${e.message})`)
          continue
        }

        core.info(`Deleted ${refName}`)

        deletedBranchs.push(refName)
      } else {
        core.info(`Kept ${refName}`)
      }
    }

    core.setOutput('deleted-branches', deletedBranchs.join(outputSeparator))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
