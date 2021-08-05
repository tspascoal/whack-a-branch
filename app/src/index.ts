import { Probot } from "probot"
import { DefaultConfiguration, Configuration } from "../../common/lib/src/configuration"
import { shouldDelete } from "../../common/lib/src/deletepredicate"

export = (app: Probot): void => {
  app.on("push", async (context) => {
    const ref = context.payload.ref.replace(/^refs\//, "")
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const deleted = context.payload.deleted
    const created = context.payload.created
    const fork = context.payload.repository.fork
    const masterBranch = context.payload.repository.master_branch

    context.log(`Received a push in ${ref} in ${owner}/${repo} deleted=${deleted} created=${created} fork=${fork}`)

    if (context.payload.deleted == false) {
      if (`heads/${masterBranch}` === ref) {
        context.log(`spared ${ref} since it's master branch`)
        return
      }

      const config: Configuration = await context.config('whack-a-branch.yml') || DefaultConfiguration

      context.log(`branches: ${JSON.stringify(config?.branches)}`)
      context.log(`onlyNew ${config.onlyNew}`)
      context.log(`deleteIfNoMatch ${config.deleteIfNoMatch}`)
      context.log(`deleteForks ${config.deleteForks}`)

      if (!config.deleteForks && fork === true) {
        context.log(`spared ${ref} since its a fork`)
        return
      }

      if (config.onlyNew && !created) {
        context.log(`spared ${ref} since it's not a new branch`)
        return
      }

      if (shouldDelete(config, ref)) {
        context.log(`going to delete ${ref} in ${owner}/${repo}`)

        try {
          await context.octokit.git.deleteRef({
            owner: owner,
            repo: repo,
            ref: ref
          })
          
          context.log(`deleted ${ref}`)
        } catch (e) {
          context.log.error(e)
        }
      } else {
        context.log(`spared ${ref}`)
      }
    }
  })
}
