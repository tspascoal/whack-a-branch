
import { Configuration } from "./configuration"
import {Minimatch, IOptions as IMinimatchOptions} from 'minimatch'

export class DeletePredicate {

    private static minimatchOptions: IMinimatchOptions = {
        dot: false,
        nobrace: true,
        nocase: true,
        nocomment: true,
        noext: true,
        nonegate: true
      }
    
    private constructor() {
        // do nothing
    }

    /**
     * @param  {string} ref reference to check
     * @param  {string[]|null|undefined} patterns The patterns to match (uses minimatch)
     * @returns boolean
     */
    private static matchesRef(ref: string, patterns: string[] | null | undefined): boolean {

        if (!patterns) return false

        return patterns.find(pattern => {
            if (!pattern.startsWith("heads/")) pattern = "heads/" + pattern

            const minimatch  = new Minimatch(pattern, DeletePredicate.minimatchOptions)

            return minimatch.match(ref)
        }) != null
    }
    
    /**
     * Predicate that returns true if the ref matches the given patterns.
     * 
     * Only checks heads refs (so tags are not supported)
     * @param  {Configuration} configuration. If branch ref doesn't include heads/ prefix, it will be added.
     * it will be automatically added.
     * @param  {string} git reference (must include heads/ prefix)
     */
    public static shouldDelete(config: Configuration, ref: string): boolean {
        if (config == null || !config.branches) return false;

        // If branches are not defined, we keep everything by default
        const keepBranches = config.branches.keep || ["**"]
        const deleteBranches = config.branches.delete
        
        const deleteIfNoMatch = config.deleteIfNoMatch || false

        const keepBranch  = DeletePredicate.matchesRef(ref, keepBranches)
        let deleteBranch = false
        if(deleteBranches) {
            deleteBranch = DeletePredicate.matchesRef(ref, deleteBranches)
        }

        if(keepBranch == false && deleteBranch == false) {
            return deleteIfNoMatch
        }

        return deleteBranch
    }
}
