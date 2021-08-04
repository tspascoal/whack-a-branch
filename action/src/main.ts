import * as core from '@actions/core'
import * as github from '@actions/github'
import {context} from '@actions/github/lib/utils'

// ######## BEGIN DIRTY HACK
// workaround for https://github.com/vercel/ncc/issues/320
// This should be referencing ../../common/src since we are using projects
import {Configuration} from './common/configuration'
import {shouldDelete} from './common/deletepredicate'
// ####### END DIRTY HACK

export async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('token', {required: true})
    const branchesKeep: string =
      core.getInput('branches-keep', {required: true, trimWhitespace: true}) ||
      '**'
    const branchesDelete: string = core.getInput('branches-delete', {
      required: false,
      trimWhitespace: true
    })
    const deleteIfNoMatch: boolean = core.getBooleanInput(
      'delete-if-no-match',
      {required: false}
    )
    const dryRun: boolean = core.getBooleanInput('dry-run', {required: false})
    const outputSeparator: string =
      core.getInput('output-separator', {required: false}) || ','

    const octokit = github.getOctokit(githubToken)

    const branches = await octokit.paginate(octokit.rest.repos.listBranches, {
      owner: context.repo.owner,
      repo: context.repo.repo,
      protected: false
    })

    core.debug(`found #${branches.length} branches`)

    const deletedBranchs: string[] = []
    const config: Configuration = {
      branches: {
        keep: branchesKeep?.split(','),
        delete: branchesDelete?.split(',')
      },
      deleteIfNoMatch
    }

    for (const branch of branches) {
      const refName = `heads/${branch.name}`

      if (branch.protected) {
        // Just in case. In the API we only asked for unprotected branches
        core.info(`Kept protected branch ${refName}`)
        continue
      }

      if (shouldDelete(config, refName)) {
        if (!dryRun) {
          await octokit.rest.git.deleteRef({
            owner: context.repo.owner,
            repo: context.repo.repo,
            ref: refName
          })
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
