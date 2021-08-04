# whack-a-branch

> A solution to delete branches that do not meet your defined criteria in terms of naming.

It has two different implementations:

- A [GitHub App](#Application) built with [Probot](https://github.com/probot/probot) this solution works in real time and deletes the branches as soon as they are pushed.
- A GitHub [action](#Action) to be used in a workflow to delete the branches on an [event](https://docs.github.com/en/actions/reference/events-that-trigger-workflows) of your choice, but most likely on a [scheduled](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#scheduled-events) basis.

You can specify the (with patterns) the branches that you want to keep and the ones you want to delete.

> **Note:** This is a _sample_ and you should run at your own risk, since deleting branches is a desctructive action that cannot be undone.

## Application

### Setup

In the `app` directory:

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

### Docker

In the `app` directory:

```sh
# 1. Build container
docker build -t whack-a-branch .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> whack-a-branch
```

### Configuration

By default, no branch will be deleted, in order to configure the application, you need to create a `.whack-a-branch.yml` file in the `.github` of the project.

The file should look like this:

```yaml
onlyNew: true  # default value: false. If true, only new branches will be deleted
deleteIfNoMatch: true # default value: false. If true, branches that do not meet the criteria will be deleted

# Patterns are case in-sensitive and can be specified with minimatch expression
branches:
  # The patterns list that defines if the branch will be kept.
  keep:  # default value "**"
    - '**' # Keep all branches by default
    - 'dev/**' # Keep all branches in the `dev` folder (redundant with the keep pattern above)
  # The patterns list that defines if the branch will be deleted.
  # If there is a conflict between keep and delete, delete will be used.
  delete:
    - master
    - 'delete/**'
    - 'test*/**'
```

#### Parameters

##### onlyNew

If this value is set to true (default value: false), only pushes to new branches will be deleted, existing branches will be kept even if they match a deletion pattern.

##### branches

To do the matching for patterns you can use [minimatch](https://github.com/isaacs/minimatch) patterns.

The branch being evaulated will be matched both against the `keep` and `delete` pattern lists.

If no match is in either of the list, then the branch will be kept or deleted based on the `deleteIfNoMatch` parameter.

> **Note:** Comparisons are case-insensitive.

The branch being evaluated will match the list of expressions in the `keep` list (order is not relevant) and it will be kept if there is a match, howeve If the branch matches any of the expressions in the `delete` list, it will be deleted (delete always wins).

> Only `heads` are supported, the patterns can either be explicit and define `heads` preffix or omit it. (eg: `head`or `heads/master`)

For more information about glob patterns, see the [Filter pattern cheat sheet](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet).

#### deleteIfNoMatch

You can play with the patterns and the `deleteIfNoMatch` option for flexibility, for example if you set this value to `true` you can explicitily set the pattern(s) that you want to keep and anything that doesn't fall into this list will be deleted.

> It is advised to always have `**` in the `keep` list in case `deleteIfNoMatch` is set to `true`.

#### Examples

Only allow branches with no _folders_ in the name:

```yaml
branches:
  keep:
    - '*'
  delete:
    - '*/**'
```

Only allow `main` and `feature` branches in a `dev` folder:

```yaml
deleteIfNoMatch: true
branches:
  keep:
    - 'main'
  delete:
    - 'dev/**'
```

Don't allow people to push `master`:

```yaml
branches:
  delete:
    - 'master'
```

### Hosting

The app is not hosted, only source code is provided. You have to do your own hosting.

## Action

### Usage

```yaml
- uses: tspascoal/whack-a-branch@v1
  id: deletebranches
  with:
    # list of branches to keep (comma separated list).
    # Default: "**"
    branches-keep: '**'

    # list of branches to delete (comma separated list).
    branches-delete:
    # If true, branches that do not meet the keep/delete criteria(s) will be deleted
    # default: false
    delete-if-no-match: 'false'

    # If true, no action deletion will occur
    # default: false
    dry-run: 'true'
    # The separator used to separate the list of deleted branches for the action output.
    # default value: ','.
    output-separator:

    # Token to be used to delete the branches.
    # Default: ${{ github.token }}
    token: ''

- run: echo we deleted ${{ steps.deletebranches.outputs.deleted-branches }}
```

See the App configuration section for more information about the parameters.

## Contributing

If you have suggestions for how whack-a-branch could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2021 Tiago Pascoal <tiago@pascoal.net>
